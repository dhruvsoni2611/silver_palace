from fastapi import FastAPI, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from supabase import create_client, Client

app = FastAPI()

# Supabase Setup
SUPABASE_URL = "https://yoslmwefsultpboxhzmn.supabase.co"
SUPABASE_KEY = "sb_publishable_W8jdJIVgSs0wbA-nb_iufw_nnIqsMfP"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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
    return {"status": "ok"}

@app.get("/api/products")
async def get_products(
    category: str = Query(None, description="Filter by category (MEN, WOMEN, KIDS, IDOLS)"),
    sub_category: str = Query(None, description="Filter by sub_category (Bracelets, Rings, etc.)"),
    weight_range: str = Query(None, description="Filter by weight range (5-10 gms, 10-15 gms, etc.)")
):
    try:
        query = supabase.table("products").select("*")
        if category:
            query = query.eq("category", category.upper())
        if sub_category:
            query = query.eq("sub_category", sub_category)
        if weight_range:
            # We can use Supabase .eq() on the weight_range column. For backwards compatibility with old numerical weight:
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
        inserted_products = []
        for image in images:
            if not image.filename:
                continue
            # 1. Upload Image to Supabase Storage
            file_ext = image.filename.split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_ext}"
            file_content = await image.read()
            
            supabase.storage.from_("product-images").upload(
                path=file_name,
                file=file_content,
                file_options={"content-type": image.content_type}
            )
            
            # 2. Get Public URL
            image_url = supabase.storage.from_("product-images").get_public_url(file_name)
            
            # 3. Insert into Table (Each image becomes a separate product)
            product_data = {
                "item_name": item_name,
                "category": category.upper(),
                "sub_category": sub_category,
                "code_no": f"SP-{uuid.uuid4().hex[:6].upper()}",
                "image_url": image_url,
                "weight_range": weight_range
            }
            db_response = supabase.table("products").insert(product_data).execute()
            inserted_products.extend(db_response.data)

        return {"success": True, "data": inserted_products}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.delete("/api/products/{code_no}")
async def delete_product(code_no: str):
    try:
        response = supabase.table("products").delete().eq("code_no", code_no).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        return {"success": False, "error": str(e)}
