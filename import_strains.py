import pandas as pd
import json
import re

df = pd.read_excel('/home/stefan/Documents/Calyx/Seedfinder_Sorten_Alle_0.4.1.xlsx')

strains = []

def parse_flower_days(val):
    if pd.isna(val):
        return None
    s = str(val).strip()
    # Find all numbers
    nums = re.findall(r'\d+', s)
    if not nums:
        return None
    if len(nums) == 1:
        return int(nums[0])
    if len(nums) >= 2:
        return int((int(nums[0]) + int(nums[1])) / 2)
    return None

for _, row in df.iterrows():
    name = str(row['Name der Strain']).strip() if not pd.isna(row['Name der Strain']) else ''
    if not name:
        continue
    
    typ_str = str(row['Typ']).lower() if not pd.isna(row['Typ']) else ''
    
    is_auto = 'auto' in name.lower() or 'auto' in typ_str or 'ruderalis' in typ_str
    strain_type = 'Autoflower' if is_auto else 'Photoperiodic'
    
    flower_days = parse_flower_days(row['Blütetage'])
    
    breeder = str(row['Breeder']).strip() if not pd.isna(row['Breeder']) else None
    
    p1 = str(row['Eltern 1']).strip() if not pd.isna(row['Eltern 1']) else None
    p2 = str(row['Eltern 2']).strip() if not pd.isna(row['Eltern 2']) else None
    parents = f"{p1} x {p2}" if p1 and p2 else (p1 if p1 else (p2 if p2 else None))
    
    fem = str(row['Feminized']).strip() if not pd.isna(row['Feminized']) else None
    
    strains.append({
        'name': name,
        'type': strain_type,
        'flowerDays': flower_days,
        'breeder': breeder,
        'parents': parents,
        'feminized': fem
    })

# Deduplicate by name (keep first occurrence)
seen = set()
unique_strains = []
for s in strains:
    nl = s['name'].lower()
    if nl not in seen:
        seen.add(nl)
        unique_strains.append(s)

# Sort alphabetically
unique_strains.sort(key=lambda x: x['name'])

with open('backend/strains.json', 'w') as f:
    json.dump(unique_strains, f, indent=2)

print(f"Exported {len(unique_strains)} unique strains to backend/strains.json")
