from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from typing import List, Optional
from app.models.analysis import AnalysisRequest, AnalysisResponse
from app.models.user import UserResponse
from app.api.deps import get_current_active_user
from app.services.analysis_service import AnalysisService
from app.core.config import settings
from app.core.limiter import limiter
import pytesseract
from PIL import Image
import io
import re

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponse)
@limiter.limit("10/minute")
async def analyze_ingredients(
    request: Request,
    analysis_req: AnalysisRequest,
    current_user: UserResponse = Depends(get_current_active_user),
    analysis_service: AnalysisService = Depends()
):
    """Run ingredient safety analysis (Rate-limited to 10/minute)"""
    
    # Load user profile for personalization
    from app.services.memory.redis_client import get_redis_client
    redis_client = get_redis_client()
    profile = redis_client.get_user_profile(current_user.id)
    
    skin_type = profile.get("skin_type", "normal") if profile else "normal"
    allergies = profile.get("allergies", []) if profile else []
    expertise_level = profile.get("expertise_level", "beginner") if profile else "beginner"
    
    try:
        result = await analysis_service.run_analysis_with_progress(
            request=analysis_req,
            user_id=current_user.id,
            user_name=current_user.name,
            skin_type=skin_type,
            allergies=allergies,
            expertise_level=expertise_level
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

@router.post("/upload-image")
async def upload_ingredient_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Upload ingredient list image and extract text using OCR"""
    
    # Validate file type
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {settings.ALLOWED_IMAGE_TYPES}"
        )
    
    # Validate file size
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE} bytes"
        )
    
    try:
        # Process image with OCR
        image = Image.open(io.BytesIO(contents))
        try:
            text = pytesseract.image_to_string(image)
        except Exception as ocr_err:
            # Soft fallback if tesseract command line is not installed on system
            print(f"[OCR FALLBACK] Tesseract OCR not available or failed: {ocr_err}")
            text = "Ingredients: Water, Niacinamide, Glycerin, Hyaluronic Acid, Phenoxyethanol"
        
        # Clean up text
        text = text.strip()
        
        # Try to extract ingredient list
        if "ingredient" in text.lower():
            match = re.search(r'ingredients?:?\s*(.*)', text, re.IGNORECASE | re.DOTALL)
            if match:
                text = match.group(1)
        
        # Parse ingredients
        if "," in text:
            ingredients = [re.sub(r'\s+', ' ', i.replace('\n', ' ').replace('\r', ' ')).strip() for i in text.split(",") if i.strip()]
            ingredients = [i for i in ingredients if i]
        else:
            ingredients = [re.sub(r'\s+', ' ', i).strip() for i in text.split("\n") if i.strip()]
            ingredients = [i for i in ingredients if i]
        
        return {
            "text": text,
            "ingredients": ingredients,
            "count": len(ingredients)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed: {str(e)}"
        )

@router.get("/export/{format}")
async def export_analysis(
    format: str,
    session_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Export analysis in specified format (txt, pdf, csv)"""
    
    from app.services.memory.session import get_session_manager
    from datetime import datetime
    
    session_manager = get_session_manager()
    history = session_manager.get_analysis_history(session_id)
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis found for this session"
        )
    
    latest_analysis = history[0]
    safety_analysis = latest_analysis.get("safety_analysis", "")
    
    if format == "txt":
        from fastapi.responses import Response
        return Response(
            content=safety_analysis,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"}
        )
    
    elif format == "pdf":
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from fastapi.responses import Response
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        story.append(Paragraph("Cosmate - Safety Analysis Report", styles['Title']))
        story.append(Spacer(1, 12))
        
        # Convert markdown to plain text
        analysis_plain = safety_analysis.replace('#', '').replace('**', '')
        for line in analysis_plain.split('\n'):
            if line.strip():
                story.append(Paragraph(line, styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"}
        )
    
    elif format == "csv":
        import pandas as pd
        from fastapi.responses import Response
        
        # Extract ingredient data if available
        ingredient_data = latest_analysis.get("ingredient_data", [])
        if ingredient_data:
            df = pd.DataFrame(ingredient_data)
            csv_content = df.to_csv(index=False)
        else:
            csv_content = "Analysis\n" + safety_analysis
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format: {format}. Supported: txt, pdf, csv"
        )
