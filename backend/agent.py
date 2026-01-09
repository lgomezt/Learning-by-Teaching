"""
Google ADK Agent for the Protégé Teachable Agent.

This module defines the agent that plays the role of "Alex", a peer learner
who asks questions and prompts the user to teach.
"""

from google import genai
from google.genai import types
from config.pedagogy import build_system_prompt
import os
import io
from dotenv import load_dotenv

load_dotenv()


# Initialize the Gemini client
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# Model configuration
MODEL_ID = "gemini-3-flash-preview"


async def generate_response_stream(
    message: str,
    context: str,
    strategy_id: str | None,
    history: list[dict]
):
    """
    Generate a streaming response from the Protégé agent.
    
    Args:
        message: The user's current message
        context: The text content from uploaded documents
        strategy_id: The active pedagogical strategy ID
        history: List of previous messages [{"role": "user"|"model", "content": "..."}]
    
    Yields:
        Text chunks as they are generated
    """
    # Build the system prompt
    system_prompt = build_system_prompt(context, strategy_id)
    
    # Convert history to Gemini format
    contents = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part(text=msg["content"])]
            )
        )
    
    # Add the current message
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part(text=message)]
        )
    )
    
    # Generate streaming response
    response = client.models.generate_content_stream(
        model=MODEL_ID,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.8,
            top_p=0.95,
            max_output_tokens=1024,
        )
    )
    
    for chunk in response:
        if chunk.text:
            yield chunk.text


async def generate_initial_message(context: str, strategy_id: str | None) -> str:
    """
    Generate an initial message from Alex when a document is uploaded.
    
    Args:
        context: The text content from the uploaded document
        strategy_id: The active pedagogical strategy ID
    
    Returns:
        Alex's opening message
    """
    system_prompt = build_system_prompt(context, strategy_id)
    
    initial_prompt = """
    The user just uploaded a document for us to study together. 
    Generate a friendly, casual greeting that:
    1. Acknowledges the study material
    2. Shows enthusiasm about studying together
    3. Picks ONE specific concept from the material to ask about
    4. Asks your first question using your assigned pedagogical strategy
    
    Keep it brief (2-4 sentences) and sound like a real student. Make sure your message is complete and not cut off mid-sentence.
    """
    
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=[
            types.Content(
                role="user",
                parts=[types.Part(text=initial_prompt)]
            )
        ],
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.9,
            max_output_tokens=1024,  # Increased from 256 to allow complete messages
        )
    )
    
    return response.text


async def extract_text_from_file(file_contents: bytes, filename: str, content_type: str) -> str:
    """
    Extract text from uploaded files.
    Uses PyPDF2 for PDFs (reliable and fast), with Gemini as fallback for complex cases.
    For text files, extracts directly.
    
    Args:
        file_contents: Raw file bytes
        filename: Original filename
        content_type: MIME type of the file
    
    Returns:
        Extracted text content
    """
    import base64
    
    # Determine file type from extension or content type
    extension = filename.split('.')[-1].lower() if '.' in filename else ''
    
    # For text files, extract directly (faster than API call)
    if extension in ['txt', 'md', 'markdown'] or content_type.startswith('text/'):
        try:
            return file_contents.decode('utf-8')
        except UnicodeDecodeError:
            # Try other encodings
            try:
                return file_contents.decode('latin-1')
            except:
                return file_contents.decode('utf-8', errors='ignore')
    
    # For PDFs, try PyPDF2 first (fast and reliable), then Gemini as fallback
    if extension == 'pdf' or content_type == 'application/pdf':
        # Try PyPDF2 first
        try:
            import PyPDF2
            pdf_file = io.BytesIO(file_contents)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_parts = []
            for page_num, page in enumerate(pdf_reader.pages, 1):
                try:
                    text = page.extract_text()
                    if text.strip():
                        text_parts.append(text)
                except Exception as page_error:
                    print(f"Warning: Could not extract text from page {page_num}: {page_error}")
                    continue
            
            if text_parts:
                return '\n\n'.join(text_parts)
            else:
                raise Exception("No text could be extracted from PDF using PyPDF2")
                
        except ImportError:
            # PyPDF2 not installed, fall through to Gemini
            print("PyPDF2 not available, using Gemini for PDF extraction...")
        except Exception as pdf_error:
            print(f"PyPDF2 extraction failed: {pdf_error}, trying Gemini...")
            # Fall through to Gemini
        
        # Fallback: Use Gemini for PDF text extraction (handles complex PDFs, scanned docs, etc.)
        try:
            # Upload file to Gemini using the file upload API
            # Save to temp file first (required by ADK)
            import tempfile
            import os
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                tmp_file.write(file_contents)
                tmp_path = tmp_file.name
            
            try:
                # Upload to Gemini (correct API: file= not path=)
                uploaded_file = client.files.upload(file=tmp_path)
                
                # Extract text using Gemini
                prompt = """Extract all text content from this PDF document. 
Return ONLY the extracted text, preserving the structure, paragraphs, and formatting as much as possible.
Do not add any commentary, explanation, or analysis - just return the raw extracted text content."""
                
                # Use the uploaded file directly in the contents
                response = client.models.generate_content(
                    model=MODEL_ID,
                    contents=[
                        prompt,
                        uploaded_file
                    ],
                    config=types.GenerateContentConfig(
                        temperature=0.1,  # Low temperature for accurate extraction
                        max_output_tokens=32768,  # Allow for large documents
                    )
                )
                
                extracted_text = response.text
                
                # Clean up
                try:
                    client.files.delete(uploaded_file.name)
                except:
                    pass
                finally:
                    try:
                        os.unlink(tmp_path)
                    except:
                        pass
                
                return extracted_text
                
            except Exception as upload_error:
                # Clean up temp file
                try:
                    os.unlink(tmp_path)
                except:
                    pass
                raise upload_error
                
        except Exception as gemini_error:
            raise Exception(f"Failed to extract text from PDF {filename}. PyPDF2 and Gemini both failed. Error: {str(gemini_error)}")
    
    # For other file types
    raise Exception(f"Unsupported file type: {extension or content_type}. Supported: PDF, TXT, MD")
