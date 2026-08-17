import hashlib

CATEGORY_MAP = {
    "automotivo": "Automotive",
    "bebes": "Baby Products",
    "beleza_saude": "Beauty & Health",
    "brinquedos": "Toys",
    "informatica_acessorios": "Computers & Accessories",
    "telefonia": "Mobile Phones",
    "moveis_decoracao": "Furniture & Decor",
    "moveis_escritorio": "Office Furniture",
    "moveis_sala": "Living Room Furniture",
    "moveis_quarto": "Bedroom Furniture",
    "pet_shop": "Pet Supplies",
    "livros_interesse_geral": "Books (General Interest)",
    "livros_tecnicos": "Books (Technical)",
    "livros_importados": "Books (Imported)",
    "cama_mesa_banho": "Home & Bedding",
    "fashion_bolsas_e_acessorios": "Fashion Accessories & Bags",
    "fashion_calcados": "Fashion Footwear",
    "fashion_roupa_masculina": "Mens Clothing",
    "fashion_roupa_feminina": "Womens Clothing",
    "fashion_roupa_infanto_juvenil": "Kids Clothing",
    "fashion_underwear_e_moda_praia": "Underwear & Beachwear",
    "audio": "Audio Devices",
    "alimentos": "Food & Grocery",
    "alimentos_bebidas": "Food & Beverages",
    "bebidas": "Beverages",
    "esporte_lazer": "Sports & Outdoors",
    "utilidades_domesticas": "Household Utilities",
    "eletronicos": "Electronics",
    "eletrodomesticos": "Home Appliances",
    "eletrodomesticos_2": "Small Appliances",
    "eletroportateis": "Portable Appliances",
    "casa_conforto": "Home Comfort",
    "casa_conforto_2": "Home Decoration",
    "casa_construcao": "Home Construction",
    "climatizacao": "Air Conditioning & Climate",
    "consoles_games": "Consoles & Gaming",
    "instrumentos_musicais": "Musical Instruments",
    "perfumaria": "Perfumes & Fragrances",
    "papelaria": "Stationery & Office",
    "artes": "Art & Crafts",
    "artes_e_artesanato": "Art & Handicrafts",
    "ferramentas_jardim": "Garden Tools",
    "sinalizacao_e_seguranca": "Signaling & Security",
    "pcs": "Computers",
    "portateis_casa_e_forno_e_fogao": "Kitchen Appliances",
    "seguros_e_servicos": "Insurance & Services",
    "tablets_impressao_imagem": "Tablets & Graphic Tablets",
    "telefonia_fixa": "Fixed Line Phones",
    "cool_stuff": "Cool Tech & Gadgets",
    "artigos_de_natal": "Christmas Decor",
    "artigos_de_festas": "Party Supplies",
    "construcao_ferramentas_construcao": "Construction Tools",
    "construcao_ferramentas_ferramentas": "Hardware Tools",
    "construcao_ferramentas_iluminacao": "Lighting Tools",
    "construcao_ferramentas_jardim": "Garden Construction Tools",
    "construcao_ferramentas_seguranca": "Safety Construction Tools",
    "flores_e_regadores": "Flowers & Watering Cans",
    "fraldas_e_higiene": "Diapers & Hygiene",
    "industria_comercio_e_negocios": "Industry & Commerce",
    "la_cuisine": "Kitchenware",
    "malas_e_mochilas": "Luggage & Backpacks",
    "market_place": "Marketplace Accessories",
    "musica": "Music CDs & Vinyl",
    "fashion_esporte": "Sportswear",
    "agro_industria_e_comercio": "Agro Industry & Commerce",
    "unknown": "General Products"
}

# Reverse mapping for category lookup
REVERSE_CATEGORY_MAP = {v.lower(): k for k, v in CATEGORY_MAP.items()}

def translate_category(portuguese_name: str) -> str:
    """Translates a Portuguese category key into its English counterpart."""
    if not portuguese_name:
        return "General Products"
    p_name = portuguese_name.strip().lower()
    return CATEGORY_MAP.get(p_name, CATEGORY_MAP.get(p_name.replace(" ", "_"), portuguese_name.title()))

def resolve_to_portuguese(english_or_portuguese: str) -> str:
    """Resolves an English category name or Portuguese key back to the internal Portuguese format."""
    if not english_or_portuguese:
        return "unknown"
    val = english_or_portuguese.strip().lower()
    # Check reverse map
    if val in REVERSE_CATEGORY_MAP:
        return REVERSE_CATEGORY_MAP[val]
    # Check exact match
    if val in CATEGORY_MAP:
        return val
    # Fallback/replace space with underscore
    val_us = val.replace(" ", "_")
    if val_us in CATEGORY_MAP:
        return val_us
    return val_us

def generate_product_name(product_id: str, category: str) -> str:
    """Deterministic product name generator using product ID md5 hash."""
    if not product_id:
        return "Generic Product Item"
    
    h = int(hashlib.md5(product_id.encode('utf-8')).hexdigest(), 16)
    
    brands = [
        "Anker", "Sony", "Logitech", "Philips", "Bosch", "Panasonic", "Nike", "Adidas", 
        "Dell", "HP", "Razer", "Lenovo", "Xiaomi", "Puma", "Casio", "Seiko", "Yamaha",
        "Apple", "Linksys", "D-Link", "Netgear", "Logitech G", "SanDisk", "Kingston", "Sennheiser"
    ]
    
    descriptors = [
        "Premium", "Ergonomic", "Professional", "Ultra-Slim", "Wireless", "Smart", 
        "Compact", "Heavy-Duty", "Portable", "Eco-Friendly", "Deluxe", "Multi-Functional",
        "High-Speed", "Super-Bass", "Waterproof", "Shockproof", "Precision"
    ]
    
    cat = category.lower() if category else ""
    
    if "informatica" in cat or "pcs" in cat or "tablets" in cat:
        nouns = ["Wireless Mouse", "Mechanical Keyboard", "Laptop Stand", "Laptop Cooling Pad", "USB-C Hub", "HDMI Adapter", "External SSD", "Gaming Mouse Pad", "Webcam HD", "Wi-Fi Router", "Stylus Pen"]
    elif "telefonia" in cat:
        nouns = ["Bluetooth Earbuds", "Wireless Charger", "Silicon Phone Case", "USB-C Cable", "Fast Car Charger", "Tempered Glass Protector", "Power Bank", "Selfie Stick", "Phone Tripod"]
    elif "esporte" in cat or "fashion_esporte" in cat:
        nouns = ["Yoga Mat", "Dumbbell Set", "Water Bottle", "Running Shoes", "Resistance Bands", "Hiking Backpack", "Camping Tent", "Fitness Tracker", "Sports Sunglasses", "Jump Rope"]
    elif "beleza" in cat or "perfumaria" in cat:
        nouns = ["Skincare Serum", "Electric Toothbrush", "Hair Dryer", "Face Moisturizer", "Sunscreen SPF 50", "Makeup Brush Set", "Essential Oil Diffuser", "Perfume Spray", "Beard Trimmer"]
    elif "brinquedos" in cat or "games" in cat:
        nouns = ["Building Blocks", "Action Figure", "Board Game", "Remote Control Car", "Stuffed Animal", "Puzzle Game", "Gaming Controller", "Console Case", "Card Deck"]
    elif "automotivo" in cat:
        nouns = ["Car Phone Mount", "Seat Organizer", "Steering Wheel Cover", "Car Vacuum Cleaner", "Dash Cam", "Microfiber Towels", "Air Freshener", "LED Headlights", "OBD2 Scanner"]
    elif "cama" in cat or "moveis" in cat or "casa" in cat:
        nouns = ["Bed Sheet Set", "Memory Foam Pillow", "Duvet Cover", "Desk Organizer", "Ergonomic Chair", "Table Lamp", "Storage Basket", "Wall Clock", "Curtain Rod"]
    elif "utilidades" in cat or "cuisine" in cat:
        nouns = ["Stainless Steel Bottle", "Food Container Set", "Kitchen Knife Set", "Cutting Board", "Non-Stick Pan", "Garlic Press", "Measuring Cups", "Silicone Spatulas"]
    elif "relogios" in cat:
        nouns = ["Quartz Wrist Watch", "Chronograph Sport Watch", "Minimalist Leather Watch", "Digital Sport Watch", "Smart Watch Band", "Luxury Dress Watch", "Automatic Watch"]
    elif "bebes" in cat or "fraldas" in cat:
        nouns = ["Baby Wipes", "Silicone Bibs", "Stroller Organizer", "Teething Toy", "Baby Monitor", "Pacifier Set", "Diaper Bag Backpack", "Baby Swaddle Blanket"]
    elif "pet" in cat:
        nouns = ["Dog Chew Toy", "Cat Scratching Post", "Pet Grooming Brush", "Self-Cleaning Litter Box", "Orthopedic Dog Bed", "Pet Water Fountain", "Collapsible Dog Bowl"]
    elif "livros" in cat:
        nouns = ["Fiction Best Seller", "Technical Handbook", "Imported Art Book", "Paperback Novel", "Science Fiction Novel", "Self-Help Book", "Biography Diary"]
    elif "fashion" in cat or "malas" in cat:
        nouns = ["Travel Backpack", "Leather Wallet", "Polarized Sunglasses", "Canvas Tote Bag", "Sports Duffel Bag", "Durable Suitcase", "Casual Wristwatch", "Leather Belt"]
    elif "audio" in cat:
        nouns = ["Noise-Cancelling Headphones", "Bluetooth Speaker", "Wireless Earbuds", "Soundbar", "Microphone Podcast Kit", "Studio Monitor Speaker"]
    else:
        nouns = ["Special Edition Item", "General Retail Product", "Premium Utility Item", "Eco Comfort Accessory", "Everyday Value Product"]
        
    brand = brands[h % len(brands)]
    desc = descriptors[(h // len(brands)) % len(descriptors)]
    noun = nouns[(h // (len(brands) * len(descriptors))) % len(nouns)]
    
    return f"{brand} {desc} {noun}"
