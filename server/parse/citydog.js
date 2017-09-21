import tress  from 'tress';
import cheerio from 'cheerio';

import chrono from 'chrono-node';
import moment from 'moment';
import axios from 'axios';

import { saveEventItemToDB, convertMonths, formatDate, checkText } from './helpers';


// let URL = 'https://citydog.by/afisha/';

const results = [];
let pagesCount = 0;


const q = tress((url, callback) => {
  setTimeout(() => { // 1 sec for citydog blocks
    axios.get(url)
      .then(data => {

        const $ = cheerio.load(data.data);

        // if main page
        if (url === 'https://citydog.by/afisha/' || url === 'https://citydog.by/vedy/') {
          // console.log('main url', url);
          pagesCount += $('.afishaMain-items .afishaMain-item').length;
          console.log(pagesCount);
          $('.afishaMain-items .afishaMain-item').each((item, i) => {
            const link = $(i).find('h3 a').attr('href');
            q.push(`${link}`);
          });
          callback();
          return;
        }

        // if event's page
        console.log('parsing', url);
        console.log(q.length());

        const page = 'div.afishaPage-container';

        if($(page).find('.afishaPost-eventInfoFooter').text().indexOf('бесплатн') === -1) {
          console.log('not free');
          callback();
          return;
        }

        const title = $(page).find('.afishaPost-Description h3').text();
        const html = $(page).html();
        // const html = $(page).find('.afishaPost-Description-text').html();
        const originalLink = url.split(`.by`)[1];

        let dateBlock = $(page).find('.afishaPost-eventInfoHeader h4').text();
        dateBlock = dateBlock.replace('|', '');

        let date;
        let year = moment().format('YYYY');

        if (dateBlock.indexOf('-') !== -1) {
          dateBlock = dateBlock.split('-')[0];
          const day = dateBlock.split('.')[0];
          const month = dateBlock.split('.')[1];


          date = formatDate(year, month, day);
          console.log(date);
        } else {

          const parsedDate = chrono.parse(convertMonths(dateBlock))[0].start.knownValues;
          // const hour = chrono.parse($(page).find('.event-data__wrapper:nth-of-type(2) > div:first-child').text())[0].start.knownValues.hour;

          console.log(parsedDate);
          const { day, month, hour } = parsedDate;

          date = formatDate(year, month, day, hour);
        }



        results.push({
          date: date,
          title: title,
          text: html,
          originalLink,
          source: 'citydog.by',
          status: checkText(html) ? 'active' : 'active',
        });

        callback();
      })
      .catch(error => {
        console.log('url failed', url);
        callback();
        // console.log(error);
      })
  }, 1000)
}, 1);

q.drain = () => {
  console.log('pages count', pagesCount);
  console.log('results length', results.length);
  // console.log(results);
  saveEventItemToDB(results);
  if (pagesCount === results.length) {
    // console.log(results);
  } else {
    // console.log('some error happened');
  }


};

const init = (url) => {
  // URL = url;
  q.push('https://citydog.by/afisha/');
  q.push('https://citydog.by/vedy/');
  // q.push(URL);
}

export default { init };
