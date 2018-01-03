from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import base64

HTML = "file:////home/alin/CLIW-APIx/Web/backend_tests/index.html"


driver = webdriver.Chrome()
driver.get("file:////home/alin/CLIW-APIx/Web/backend_tests/index.html")


canvas = driver.find_element_by_css_selector("#canvas")

# get the canvas as a PNG base64 string
canvas_base64 = driver.execute_script("return arguments[0].toDataURL('image/png').substring(21);", canvas)

# decode
canvas_png = base64.b64decode(canvas_base64)

# save to a file
with open(r"canvas.png", 'wb') as f:
    f.write(canvas_png)
driver.close()


class Session:
    def __init__(self, sessionID, width, height):
        # One driver per session
        self.driver = webdriver.Chrome()
        self.driver.get(HTML)
        self.width = width
        self.height = height
        self.id = sessionID

    def save_canvas_state(self, filename):
        canvas = self.driver.find_element_by_css_selector("#canvas")

        # get the canvas as a PNG base64 string
        canvas_base64 = self.driver.execute_script("return arguments[0].toDataURL('image/png').substring(21);", canvas)

        # decode
        canvas_png = base64.b64decode(canvas_base64)

        # save to a file
        import os
        if not (os.path.exists(str(id)) and os.path.isdir(str(id))):
            os.mkdir(str(id))

        with open(os.path.join(str(id), filename), 'wb') as f:
            f.write(canvas_png)

    def apply_update(self, json):
        update = self.parse_update_json()
        # Update based on what we recieved from the json
        driver.execute_script("drawBetweenPoints(100,100,200,200);")

    def parse_update_json(self):
        pass
