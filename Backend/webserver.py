import flask
from flask import Flask, render_template, request, session, url_for, redirect

app = Flask(__name__)
app.secret_key = "cliw"
session_id_param_name = "sessionId"

@app.route('/')
def index():
    sessionId = request.args.get(session_id_param_name, '')
    if sessionId != '':
        session[session_id_param_name] = sessionId
        return redirect(url_for('index'))
    else:
        if session_id_param_name not in session.keys():
            session[session_id_param_name] = '1'

    return render_template('test.html',script = url_for('static', filename='js/script.js'),
                                        style = url_for('static', filename='css/style.css'))

@app.route('/session')
def get_session():
    response = flask.Response(response = session[session_id_param_name], status = 200, mimetype='text/plain')
    return response

if __name__ == '__main__':
    app.run()

