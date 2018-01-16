import json
import uuid

import flask
from flask import Flask, render_template, request, session, url_for, redirect

application = Flask(__name__)
application.secret_key = "cliw"
session_id_param_name = "sessionId"
cliend_id_param_name = "clientId"
existing_session_param_name = "existingSession"
next_client_id = 0
next_session_id = 0
@application.route('/')
def index():
    global next_client_id
    global next_session_id
    # clientId = uuid.uuid1()
    sessionId = request.args.get(session_id_param_name, '')
    if sessionId != '':
        session[session_id_param_name] = str(sessionId)
        session[cliend_id_param_name] = str(next_client_id)
        session[existing_session_param_name] = True
        next_client_id += 1
        return redirect(url_for('index'))
    else:
        if session_id_param_name not in session.keys():
            session[session_id_param_name] = str(next_session_id)
            session[cliend_id_param_name] = str(next_client_id)
            next_session_id += 1
            next_client_id += 1
            # If it's actually coming for the first time
            if existing_session_param_name not in session.keys():
                session[existing_session_param_name] = False


    return render_template('index.html',
                           index_css = url_for('static', filename="css/index.css"),
                           icons_css = url_for('static', filename="css/icons.css"),
                           modal_css = url_for('static', filename="css/modal.css"),
                           non_canvas_js = url_for('static', filename="js/non-canvas.js"),
                           canvas_js = url_for('static', filename="js/canvas.js"),
                           modal_js = url_for('static', filename="js/modal.js"))

@application.route('/session')
def get_session():
    r = {}
    r[session_id_param_name] = session[session_id_param_name]
    r[cliend_id_param_name] = session[cliend_id_param_name]
    r[existing_session_param_name] = session[existing_session_param_name]
    response = flask.Response(response = json.dumps(r), status = 200, mimetype='text/plain')
    return response

if __name__ == '__main__':
    application.run()

