import json
import os

existing_file = "backend/strains.json"

try:
    with open(existing_file, "r") as f:
        existing_strains = json.load(f)
except Exception:
    existing_strains = []

existing_names = {s['name'].lower() for s in existing_strains}

new_strains_data = [
    {"name": "Cherry Pie", "type": "Photoperiodic", "flowerDays": 60},
    {"name": "Sunset Sherbet", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Tangie", "type": "Photoperiodic", "flowerDays": 70},
    {"name": "Chocolope", "type": "Photoperiodic", "flowerDays": 70},
    {"name": "Gushers", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Tropicana Cookies", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "MAC (Miracle Alien Cookies)", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Purple Haze", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Alaskan Thunder Fuck", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "L.A. Confidential", "type": "Photoperiodic", "flowerDays": 55},
    {"name": "Strawberry Banana", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Alien OG", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Death Star", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Biscotti", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Ice Cream Cake", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "GMO Cookies", "type": "Photoperiodic", "flowerDays": 70},
    {"name": "Cereal Milk", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Motorbreath", "type": "Photoperiodic", "flowerDays": 70},
    {"name": "Grease Monkey", "type": "Photoperiodic", "flowerDays": 60},
    {"name": "Blackberry Kush", "type": "Photoperiodic", "flowerDays": 55},
    {"name": "Grape Ape", "type": "Photoperiodic", "flowerDays": 55},
    {"name": "Banana Kush", "type": "Photoperiodic", "flowerDays": 60},
    {"name": "Headband", "type": "Photoperiodic", "flowerDays": 70},
    {"name": "Tahoe OG", "type": "Photoperiodic", "flowerDays": 70},
    {"name": "Pennywise", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Harlequin", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Cannatonic", "type": "Photoperiodic", "flowerDays": 70},
    {"name": "ACDC", "type": "Photoperiodic", "flowerDays": 70},
    {"name": "Charlotte's Web", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Sour Tsunami", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Blue Cheese", "type": "Photoperiodic", "flowerDays": 60},
    {"name": "White Russian", "type": "Photoperiodic", "flowerDays": 60},
    {"name": "Chronic", "type": "Photoperiodic", "flowerDays": 60},
    {"name": "Super Skunk", "type": "Photoperiodic", "flowerDays": 50},
    {"name": "G13", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Chemdawg 4", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Gorilla Glue Auto", "type": "Autoflower", "flowerDays": 60},
    {"name": "Amnesia Auto", "type": "Autoflower", "flowerDays": 70},
    {"name": "Blue Dream Auto", "type": "Autoflower", "flowerDays": 65},
    {"name": "Sour Diesel Auto", "type": "Autoflower", "flowerDays": 75},
    {"name": "Girl Scout Cookies Auto", "type": "Autoflower", "flowerDays": 60},
    {"name": "Zkittlez Auto", "type": "Autoflower", "flowerDays": 60},
    {"name": "Gelato Auto", "type": "Autoflower", "flowerDays": 60},
    {"name": "Critical Auto", "type": "Autoflower", "flowerDays": 50},
    {"name": "Royal Gorilla", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Green Gelato", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Fat Banana", "type": "Photoperiodic", "flowerDays": 55},
    {"name": "HulkBerry", "type": "Photoperiodic", "flowerDays": 70},
    {"name": "Shogun", "type": "Photoperiodic", "flowerDays": 75},
    {"name": "Somango XL", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "O.G. Kush Auto", "type": "Autoflower", "flowerDays": 60},
    {"name": "Wedding Gelato", "type": "Photoperiodic", "flowerDays": 60},
    {"name": "Sweet ZZ", "type": "Photoperiodic", "flowerDays": 55},
    {"name": "Watermelon Automatic", "type": "Autoflower", "flowerDays": 60},
    {"name": "Mimosa Automatic", "type": "Autoflower", "flowerDays": 60},
    {"name": "Purple Queen", "type": "Photoperiodic", "flowerDays": 60},
    {"name": "Royal Dwarf", "type": "Autoflower", "flowerDays": 60},
    {"name": "Quick One", "type": "Autoflower", "flowerDays": 55},
    {"name": "Easy Bud", "type": "Autoflower", "flowerDays": 55},
    {"name": "Dance World", "type": "Photoperiodic", "flowerDays": 60},
    {"name": "Medical Mass", "type": "Photoperiodic", "flowerDays": 50},
    {"name": "Painkiller XL", "type": "Photoperiodic", "flowerDays": 60},
    {"name": "Euphoria", "type": "Photoperiodic", "flowerDays": 60},
    {"name": "Stress Killer Automatic", "type": "Autoflower", "flowerDays": 70},
    {"name": "Fast Eddy Automatic", "type": "Autoflower", "flowerDays": 65},
    {"name": "Solomatic CBD", "type": "Autoflower", "flowerDays": 65},
    {"name": "Tatanka Pure CBD", "type": "Photoperiodic", "flowerDays": 55},
    {"name": "Purplematic CBD", "type": "Autoflower", "flowerDays": 60},
    {"name": "Joanne's CBD", "type": "Photoperiodic", "flowerDays": 55},
    {"name": "Royal CBG Automatic", "type": "Autoflower", "flowerDays": 60},
    {"name": "Royal CBDV Automatic", "type": "Autoflower", "flowerDays": 60},
    {"name": "Milky Way F1", "type": "Autoflower", "flowerDays": 55},
    {"name": "Medusa F1", "type": "Autoflower", "flowerDays": 55},
    {"name": "Titan F1", "type": "Autoflower", "flowerDays": 55},
    {"name": "Apollo F1", "type": "Autoflower", "flowerDays": 55},
    {"name": "Orion F1", "type": "Autoflower", "flowerDays": 50},
    {"name": "Hyperion F1", "type": "Autoflower", "flowerDays": 60},
    {"name": "Epsilon F1", "type": "Autoflower", "flowerDays": 45},
    {"name": "Cosmos F1", "type": "Autoflower", "flowerDays": 55},
    {"name": "Special Queen 1", "type": "Photoperiodic", "flowerDays": 55},
    {"name": "Special Kush 1", "type": "Photoperiodic", "flowerDays": 55},
    {"name": "Bubble Kush", "type": "Photoperiodic", "flowerDays": 55},
    {"name": "Candy Kush Express", "type": "Photoperiodic", "flowerDays": 50},
    {"name": "Speedy Chile", "type": "Photoperiodic", "flowerDays": 45},
    {"name": "Royal Cheese", "type": "Photoperiodic", "flowerDays": 50},
    {"name": "Lemon Shining Silver Haze", "type": "Photoperiodic", "flowerDays": 65},
    {"name": "Shining Silver Haze", "type": "Photoperiodic", "flowerDays": 70},
    {"name": "Royal Moby", "type": "Photoperiodic", "flowerDays": 70},
    {"name": "Royal Haze Automatic", "type": "Autoflower", "flowerDays": 65},
    {"name": "Amnesia Haze Automatic", "type": "Autoflower", "flowerDays": 65},
    {"name": "White Widow Automatic", "type": "Autoflower", "flowerDays": 60},
    {"name": "Northern Light Automatic", "type": "Autoflower", "flowerDays": 60},
    {"name": "Jack Herer Automatic", "type": "Autoflower", "flowerDays": 60},
    {"name": "Diesel Automatic", "type": "Autoflower", "flowerDays": 65},
    {"name": "Critical Automatic", "type": "Autoflower", "flowerDays": 55},
    {"name": "Cheese Automatic", "type": "Autoflower", "flowerDays": 60},
    {"name": "Sweet Skunk Automatic", "type": "Autoflower", "flowerDays": 55},
    {"name": "Royal Bluematic", "type": "Autoflower", "flowerDays": 60},
    {"name": "Royal AK Automatic", "type": "Autoflower", "flowerDays": 65},
    {"name": "Bubble Kush Automatic", "type": "Autoflower", "flowerDays": 60},
]

added_count = 0
for s in new_strains_data:
    if s['name'].lower() not in existing_names:
        existing_strains.append(s)
        existing_names.add(s['name'].lower())
        added_count += 1

existing_strains.sort(key=lambda x: x['name'])

with open(existing_file, "w") as f:
    json.dump(existing_strains, f, indent=2)

print(f"Added {added_count} new strains. Total is now {len(existing_strains)}.")
