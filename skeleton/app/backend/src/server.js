const app  = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Backend corriendo en puerto ${port}`);
  console.log(`Cloud provider: ${process.env.CLOUD_PROVIDER || 'aws'}`);
});
