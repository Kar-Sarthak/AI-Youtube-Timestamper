from flask import Flask, request, jsonify
from flask_cors import CORS
from extract_transcript import get

app = Flask(__name__)
CORS(app)  # <-- enables all cross-origin requests

@app.route("/echo", methods=["POST"])
def echo():
    data = request.get_json()
    #print(data['message'])
    return_value =  get(data['message'])
    #print(return_value)

    #return jsonify({"you_sent": data})
    return jsonify({"transcript": return_value})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
