#!/bin/bash

rm firefox.xpi
zip -r firefox.zip icons manifest.json *.js
mv firefox.zip firefox.xpi
