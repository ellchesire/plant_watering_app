from flask import Flask, jsonify, request
import psycopg2
import time
from flask_cors import CORS

app = Flask(__name__)

CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:8080"])

# wait for database to be ready
def get_connection():
    while True:
        try:
            conn = psycopg2.connect(
                host="db",          # 👈 docker service name
                database="mydatabase",
                user="myuser",
                password="mypassword"
            )
            return conn
        except:
            print("Waiting for database...")
            time.sleep(2)
@app.route("/")
def home():
    return "OK"

@app.route("/add_plants", methods=["POST"])
def add_plant():
    data = request.get_json()
    plant_name = data.get("plant_name")
    interval =data.get("interval")
    location = data.get("location", "N/A") 
    watered_date = data.get("watered_date", None) 
    print(location, watered_date)
    
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO plants (name, interval, location, last_watered) VALUES (%s, %s, %s, %s) RETURNING id;",
        (plant_name,interval, location, watered_date)
    )

    new_id = cur.fetchone()[0]
    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"id": new_id, "plant_name": plant_name})
@app.route("/get_plants")
def get_plants():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM plants;"
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    plants = []
    for row in rows:
        plants.append({
            "id":row[0],
            "name": row[1],
            "interval": row[2],
            "location": row[3],
            "last_watered": row[4]
        })
    return jsonify(plants)
@app.route("/edit_plant/<int:id>", methods=['PATCH'])
def edit_plant(id):
    data = request.get_json()
    fields = []

    plant_name = data.get("plant_name", None)
    interval =data.get("interval", None)
    location = data.get("location", None) 
    watered_date = data.get("watered_date", None)
    plant_id = id
    
    conn = get_connection()
    cur = conn.cursor()

    fields = []
    values = []

    if plant_name is not None:
        fields.append("name = %s")
        values.append(plant_name or "N/A")

    if interval is not None:
        fields.append("interval = %s")
        values.append(interval or 0)

    if location is not None:  
        fields.append("location = %s")
        values.append(location or None)

    if watered_date is not None:
        fields.append("last_watered = %s")
        values.append(watered_date or None)

    print(fields, values)
    if fields:
        # Join the fields with commas for SQL
        sql = f"UPDATE plants SET {', '.join(fields)} WHERE id = %s;"
        values.append(plant_id)  

        cur.execute(sql, values)
        conn.commit()

    return jsonify({"status": "success", "updated_fields": data})
@app.route("/del_plant/<int:id>", methods=['DELETE'])
def delete(id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "DELETE FROM plants WHERE id = %s", (id,)
        )

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"status": "success", "deleted_id": id})
app.run(host="0.0.0.0", port=5000)