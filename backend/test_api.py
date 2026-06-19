import requests

url = "http://127.0.0.1:8000/plants/"

# 1. Fetch plants
resp = requests.get(url)
plants = resp.json()
if len(plants) > 0:
    plant_id = plants[0]['id']
    print("Found plant", plant_id)
    
    # 2. Update plant sensor_config
    new_config = {"quickActions": [{"id": "test_1", "label": "Test"}]}
    update_resp = requests.put(url + plant_id, json={"sensor_config": new_config})
    print("Update status:", update_resp.status_code)
    print("Update response:", update_resp.json().get('sensor_config'))
    
    # 3. Fetch again to verify persistence
    verify_resp = requests.get(url + plant_id)
    print("Verify response:", verify_resp.json().get('sensor_config'))
else:
    print("No plants found")
