import flask
from flask import Flask, session, redirect, url_for, request, make_response, Response

app = Flask(__name__)

app.secret_key = "dasmk"
@app.route('/')
def index():
    if 'username' in session:
        username = session['username']
        return 'Logged in as ' + username + '<br>' + \
               "<b><a href = '/logout'>click here to log out</a></b>"
    return "You are not logged in <br><a href = '/login'></b>" + \
           "click here to log in</b></a>"


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        session['username'] = request.form['username']
        return redirect(url_for('index'))
    return '''

   <form action = "" method = "post">
      <input type ="text" name = "username"/>
      <input type = "submit" value = "Login"/>
   </form>

   '''


@app.route('/logout')
def logout():
   # remove the username from the session if it is there
   session.pop('username', None)
   return redirect(url_for('index'))

@app.route('/session')
def sess():
    response = flask.Response(response = session['username'], status = 200, mimetype='text/plain')
    return response

if __name__ == "__main__":
    app.run()