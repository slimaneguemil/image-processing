//https://www.npmjs.com/package/probe-image-size

services offer 2 endpoints

retrieve size, type, mime/type,unit of an image
POST /info  
 input : form/data samplefile/file
 ouput : jason
 
 POST/upload
  input : form/data samplefile/file
  ouput :  file with mimetype image/*
  
  
run it:
docker build -t wipo-sharp .
docker run -d -p 4003:4003 -e "PORT=4003" wipo-sharp
