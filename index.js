const app = require("./Main"),
  PORT = process.env.PORT || 4500;

app.listen(PORT, () => {
  console.log(`Server Started At PORT : ${PORT}\n`);
});
