:: 0a. Login (PUBLIC)
curl -i -X POST http://localhost:4000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"william.eburn@gmail.com\",\"password\":\"660080126\"}"

:: Copy the accessToken from the JSON response and paste here:
set TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MGVmMDRiOS1kZTdmLTQwZDYtYjkyYy02NmY4NjcxYTMxMTQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTU4OTQyODUsImV4cCI6MTc1NTg5NTE4NX0.92qkIEpeItlpZjfIY5yuRFYWSuXpA8JoIrZqg7VEelw","user":{"id":"70ef04b9-de7f-40d6-b92c-66f8671a3114"

:: 0b. GET homes (PROTECTED)
curl -i http://localhost:4000/api/homes -H "Authorization: Bearer %TOKEN%"
pause