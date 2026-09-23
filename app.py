import os
import threading
import webbrowser
from flask import Flask, render_template
from routes.api import api_bp

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.register_blueprint(api_bp)

@app.route("/")
def index():
    return render_template("index.html")

def open_browser(port):
    webbrowser.open_new_tab(f"http://127.0.0.1:{port}")

if __name__ == "__main__":
    port = 5000
    print(f"🚀 Google Calendar Schedule App đang khởi động tại http://localhost:{port}...")
    threading.Timer(1.2, open_browser, args=[port]).start()
    app.run(host="127.0.0.1", port=port, debug=False)
