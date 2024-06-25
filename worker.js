const BASE_DATE = new Date('1997-10-07');

onmessage = (e) => {
  let { bank, date, value, amount, index } = e.data;
  const parsedDate = parseInt((new Date(date) - BASE_DATE) / (1000 * 60 * 60 * 24), 10);
  value = value || getRandomBcValue();
 
  postMessage({
    bcData: {
      barcode: getNewBarcode(bank, parsedDate, value), 
      bank: bank, 
      duedate: date, 
      value: Number(value.substring(0, 8)+"."+value.substring(8, 10)), 
      index: index + 1
    }, 
    percentage: getPercentage(index + 1, amount)
  });
};

const getNewBarcode = (banco, date, value) => {
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
