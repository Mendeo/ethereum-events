# ethereum-events


Purpose of the program: watching events generated by the specified smart contract in the Ethereum blockchain network.

The program can be useful for developers of smart contracts.

* The program is designed as a web page and is available on GitHub Pages: https://ethereum-events.com
* The MetaMask extension must be installed in the browser.
* The web page is adapted to work on a smartphone.

After opening the program page in the browser, you will need to click on the "Connect with Meta Mask" button, then the page will request a connection to the blockchain via MetaMask. After a successful connection, you have to enter the smart contract address and ABI. The program will start listening the events of this contract after clicking the "Start listening" button.

* *The web3.js library is used*.
* *MetaMask won't work if you just open index.html in a browser without a web server.*
* *Translation options are located in the "lang" folder (values from lang.json can be included to info.html by using the <lang:> tag).*
------
Назначение программы: отслеживание событий, которые генерирует заданный смарт контракт в сети Ethereum.

Программа может быть полезна для разработчиков смарт контрактов.

* Программа выполнена в виде веб страницы и доступна на GitHub Pages: https://ethereum-events.com
* В браузере должно быть установлено расширение MetaMask.
* Веб страница адаптирована для работы на смартфоне.

После открытия страницы программы в браузере, нужно будет нажать на кнопку "Connect with MetaMask", тогда страница запросит соединение с блокчейном через MetaMask. После успешного соединения нужно ввести адрес смарт контракта и его ABI. Программа начнёт отслеживать события этого контракта после нажатия на кнопку "Start listening".

* *Для работы используется библиотека web3.js.*
* *MetaMask не будет работать, если просто открыть index.html в браузере без веб сервера.*
* *Варианты перевода на другие языки находятся в папке "lang" (значения из lang.json можно использовать в info.html  при помощи тега <lang:>)*
