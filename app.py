from flask import Flask, request, jsonify, session
from flask_cors import CORS
import sqlite3
import requests
import os
app = Flask(__name__)
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = False  # True only for HTTPS
app.secret_key = "secret123"

CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# ================= GROQ API KEY =================

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# ================= DATABASE =================

def init_db():
    conn = sqlite3.connect("users.db")
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS progress(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            topic_index INTEGER,
            completed BOOLEAN
        )
    """)

    conn.commit()
    conn.close()

init_db()

# ================= TEST ROUTE =================

@app.route("/")
def home():
    return "Backend running with Groq AI 🚀"

# ================= SIGNUP =================

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = sqlite3.connect("users.db")
    c = conn.cursor()

    try:
        c.execute(
            "INSERT INTO users(email,password) VALUES (?,?)",
            (email, password)
        )
        conn.commit()
        return jsonify({"message": "Signup successful"})
    except:
        return jsonify({"error": "User already exists"}), 400
    finally:
        conn.close()

# ================= LOGIN =================

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = sqlite3.connect("users.db")
    c = conn.cursor()

    c.execute(
        "SELECT * FROM users WHERE email=? AND password=?",
        (email, password)
    )

    user = c.fetchone()
    conn.close()

    if user:
        session["user_id"] = user[0]
        return jsonify({"message": "Login successful"})

    return jsonify({"error": "Invalid credentials"}), 401

# ================= GENERATE ROADMAP (GROQ AI) =================

@app.route("/generate-roadmap", methods=["POST"])
def generate_roadmap():

    data = request.json

    goal       = data.get("goal")
    level      = data.get("level")
    weeks      = data.get("weeks")
    hours      = data.get("hours") or data.get("hours_per_day")  # accept both field names

    prompt = f"""
You are a learning roadmap generator. Create a structured weekly roadmap in JSON format only.

Goal: {goal}
Level: {level}
Duration: {weeks} weeks
Study time: {hours} hours per day

Return ONLY valid JSON with this exact structure (no extra text, no markdown, no explanation):
{{
  "goal": "{goal}",
  "level": "{level}",
  "weeks": [
    {{
      "week": 1,
      "title": "Week title here",
      "topics": [
        {{
          "name": "Topic name",
          "subtopics": ["subtopic 1", "subtopic 2"]
        }}
      ]
    }}
  ]
}}

Include {weeks} weeks. Each week should have 3-5 topics with 2-4 subtopics each.
Return ONLY the JSON object, nothing else.
"""

    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    body = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": "You are a JSON API. You return only valid JSON, never markdown or explanation."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    response = requests.post(url, headers=headers, json=body)
    result = response.json()

    content = result["choices"][0]["message"]["content"].strip()

    # Try to parse as JSON first (structured response)
    import json as json_lib
    try:
        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        structured = json_lib.loads(content)
        return jsonify(structured)
    except Exception:
        # Fallback: return raw text for frontend parser
        return jsonify({"roadmap": content, "goal": goal, "level": level})

# ================= SAVE PROGRESS =================

@app.route("/save-progress", methods=["POST"])
def save_progress():

    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401

    data = request.json
    topic_index = data.get("topic_index")
    completed = data.get("completed")

    conn = sqlite3.connect("users.db")
    c = conn.cursor()

    c.execute("""
        INSERT OR REPLACE INTO progress
        (user_id, topic_index, completed)
        VALUES (?, ?, ?)
    """, (session["user_id"], topic_index, completed))

    conn.commit()
    conn.close()

    return jsonify({"message": "Progress saved"})

# ================= LOAD PROGRESS =================

@app.route("/load-progress", methods=["GET"])
def load_progress():

    if "user_id" not in session:
        return jsonify({})

    conn = sqlite3.connect("users.db")
    c = conn.cursor()

    c.execute("""
        SELECT topic_index, completed
        FROM progress
        WHERE user_id=?
    """, (session["user_id"],))

    rows = c.fetchall()
    conn.close()

    progress = {str(r[0]): bool(r[1]) for r in rows}

    return jsonify(progress)

# ================= LOGOUT =================

@app.route("/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})

# ================= RUN =================

if __name__ == "__main__":
    app.run(debug=True, port=5000)