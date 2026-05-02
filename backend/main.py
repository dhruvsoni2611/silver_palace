from fastapi import FastAPI, Query, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from supabase import create_client, Client

app = FastAPI()

# Supabase Setup — credentials loaded from environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://yoslmwefsultpboxhzmn.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

supabase: Client = None

def get_supabase():
    global supabase
    if supabase is None:
        if not SUPABASE_KEY:
            raise HTTPException(status_code=500, detail="SUPABASE_KEY environment variable not set")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "supabase_url": SUPABASE_URL, "key_set": bool(SUPABASE_KEY)}

@app.get("/api/products")
async def get_products(
    category: str = Query(None, description="Filter by category (MEN, WOMEN, KIDS, IDOLS)"),
    sub_category: str = Query(None, description="Filter by sub_category (Bracelets, Rings, etc.)"),
    weight_range: str = Query(None, description="Filter by weight range (5-10 gms, 10-15 gms, etc.)")
):
    try:
        db = get_supabase()
        query = db.table("products").select("*")
        if category:
            query = query.eq("category", category.upper())
        if sub_category:
            query = query.eq("sub_category", sub_category)
        if weight_range:
            if weight_range == "5-10 gms":
                query = query.or_(f"weight_range.eq.5-10 gms,and(weight.gte.5,weight.lte.10)")
            elif weight_range == "10-15 gms":
                query = query.or_(f"weight_range.eq.10-15 gms,and(weight.gte.10,weight.lte.15)")
            elif weight_range == "15-25 gms":
                query = query.or_(f"weight_range.eq.15-25 gms,and(weight.gte.15,weight.lte.25)")
            elif weight_range == "25+ gms":
                query = query.or_(f"weight_range.eq.25+ gms,weight.gte.25")
            else:
                query = query.eq("weight_range", weight_range)
        response = query.execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/products")
async def add_product(
    item_name: str = Form(...),
    category: str = Form(...),
    sub_category: str = Form(...),
    weight_range: str = Form(None),
    images: list[UploadFile] = File(...)
):
    try:
        db = get_supabase()
        inserted_products = []
        for image in images:
            if not image.filename:
                continue
            file_ext = image.filename.split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_ext}"
            file_content = await image.read()
            
            db.storage.from_("product-images").upload(
                path=file_name,
                file=file_content,
                file_options={"content-type": image.content_type}
            )
            image_url = db.storage.from_("product-images").get_public_url(file_name)
            
            product_data = {
                "item_name": item_name,
                "category": category.upper(),
                "sub_category": sub_category,
                "code_no": f"SP-{uuid.uuid4().hex[:6].upper()}",
                "image_url": image_url,
                "weight_range": weight_range
            }
            db_response = db.table("products").insert(product_data).execute()
            inserted_products.extend(db_response.data)

        return {"success": True, "data": inserted_products}
        
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.delete("/api/products/{code_no}")
async def delete_product(code_no: str):
    try:
        db = get_supabase()
        response = db.table("products").delete().eq("code_no", code_no).execute()
        return {"success": True, "data": response.data}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}
