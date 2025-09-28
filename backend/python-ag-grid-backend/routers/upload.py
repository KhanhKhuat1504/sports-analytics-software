from fastapi import APIRouter, HTTPException, UploadFile, File

router = APIRouter()

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    try:
            if not file.filename:
                raise HTTPException(status_code=400, detail="No file uploaded")

            print(f"Uploaded file: {file.filename}")

            return {
                "message": "File uploaded successfully",
                "filename": file.filename,
                "content_type": file.content_type,
                "size": file.size
            }

    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")