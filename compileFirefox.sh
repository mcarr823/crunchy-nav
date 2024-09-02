#!/bin/bash

rm firefox.xpi
zip -r firefox.zip icons manifest.json js css
mv firefox.zip firefox.xpi
