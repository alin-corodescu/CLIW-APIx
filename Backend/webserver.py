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
        session[session_id_param_name] = sessionId
        session[cliend_id_param_name] = clientId
        return redirect(url_for('index'))
    else:
        if session_id_param_name not in session.keys():
            session[session_id_param_name] = clientId
            session[cliend_id_param_name] = clientId

    return render_template('test.html',script = url_for('static', filename='js/script.js'),
                                        style = url_for('static', filename='css/style.css'))

@app.route('/session')
def get_session():
    r = {}
    r[session_id_param_name] = session[session_id_param_name]
    r[cliend_id_param_name] = session[cliend_id_param_name]
    response = flask.Response(response = json.dumps(r), status = 200, mimetype='text/plain')
    return response

if __name__ == '__main__':
    app.run()

