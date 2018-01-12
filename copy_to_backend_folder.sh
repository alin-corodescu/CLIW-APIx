#!/bin/bash

# This script will copy all the necessary files from the Website
# folder into the backend, so the webserver serve them
set +x

echo "This script will not copy your html file to the webserver location, only the js and css"

rm Backend/static/js/*
rm Backend/static/css/*
rm Backend/static/resources/*

cp -r Website/js Backend/static/ 
cp -r Website/css Backend/static/
cp -r Website/resources Backend/static/

#cp Website/*.html Backend/templates/



