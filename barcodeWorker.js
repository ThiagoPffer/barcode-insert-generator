const BASE_DATE = new Date('1997-10-07');

onmessage = (e) => {
  const data = e.data;
  const date = parseInt((new Date(data[1]) - BASE_DATE) / (1000 * 60 * 60 * 24), 10)
  const value = data[2] ? String(data[2]) : getRandomBcValue()

  postMessage({
    bcData: {
      barcode: getNewBarcode(data[0], date, value), 
      bank: data[0], 
      duedate: data[1], 
      value: Number(value.substring(0, 8)+"."+value.substring(8, 10)), 
      index: data[3]+1
    }, 
    percentage: getPercentage(data[3]+1, data[4])
  });
};

const getNewBarcode = (banco, date, value) => {
  // 341 229740 0000065090 6216579879878151615623232
  let barcode = banco;
  barcode += Math.floor(Math.random()*(100-10)+10);
  barcode += String(date);
  barcode += value;
  let bcOtherNumbers = '';
  for (let i = 0; i < 25; i++) { bcOtherNumbers += String(Math.floor(Math.random()*(9-1)+1)); }
  barcode += bcOtherNumbers;

  return barcode;
}

const getRandomBcValue = () => {
  let randomBcValue = '';
  for (let i = 0; i < 7; i++) { randomBcValue += String(Math.floor(Math.random() * 9)); }
  return `000${randomBcValue}`;
}

const getPercentage = (crrnt, total) => {
  return (crrnt * 100) / total;
}
