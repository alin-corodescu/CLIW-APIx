import json
import uuid

import flask
from flask import Flask, render_template, request, session, url_for, redirect

app = Flask(__name__)
app.secret_key = "cliw"
session_id_param_name = "sessionId"
cliend_id_param_name = "clientId"


@app.route('/')
def index():
    clientId = uuid.uuid1()
    sessionId = request.args.get(session_id_param_name, '')
    if sessionId != '':
        session[session_id_param_name] = str(sessionId)
        session[cliend_id_param_name] = str(clientId)
        return redirect(url_for('index'))
    else:
        if session_id_param_name not in session.keys():
            session[session_id_param_name] = str(clientId)
            session[cliend_id_param_name] = str(clientId)

    return render_template('index.html',
                           index_css = url_for('static', filename="css/index.css"),
                           icons_css = url_for('static', filename="css/icons.css"),
                           modal_css = url_for('static', filename="css/modal.css"),
                           non_canvas_js = url_for('static', filename="js/non-canvas.js"),
                           canvas_js = url_for('static', filename="js/canvas.js"),
                           modal_js = url_for('static', filename="js/modal.js"))

@app.route('/session')
def get_session():
    r = {}
    r[session_id_param_name] = session[session_id_param_name]
    r[cliend_id_param_name] = session[cliend_id_param_name]
    response = flask.Response(response = json.dumps(r), status = 200, mimetype='text/plain')
    return response

if __name__ == '__main__':
    app.run()

