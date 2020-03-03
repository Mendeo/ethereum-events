/*
	Copyright © 2020 Aleksandr Menyaylo (Александр Меняйло)

    This file is part of "eth-events".

    "eth-events" is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    "eth-events" is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with "eth-events". If not, see <https://www.gnu.org/licenses/>.
*/
'use strict';
const _provider = window['ethereum'];
let _contractAddress;
let _contractAbi;
const _bgDiv = document.getElementById('bgDiv'); //Белый фон в центре.

//Зполняем белым фоном центр.
function fillBg()
{
	_bgDiv.style.height = document.documentElement.clientHeight + 'px';
}
fillBg();
window.addEventListener('resize', fillBg);
/***************************/

//Отображаем описание
const DEFAULT_LANG = 'en-US'
const _lang = navigator.browserLanguage || navigator.language || navigator.userLanguage || DEFAULT_LANG;
const _info = document.getElementById('info');
_info.hidden = false;
displayInfo();

async function displayInfo()
{
	let res = await fetch(`/lang/${_lang}/info.html`);
	if (!res.ok) res = await fetch(`/lang/${DEFAULT_LANG}/info.html`);
	let info = res.ok ? await res.text() : false;
	if (info) _info.innerHTML = info;
}

//Проверка на наличе MetaMask
if (typeof window.ethereum !== 'undefined')
{
	const connectBt = document.getElementById('connectBt');
	connectBt.addEventListener('click', () =>
		{
			_provider.enable().then(onConnect).catch(console.log);
			connectBt.hidden = true;
			_info.hidden = true;
		});
	_provider.on('chainChanged', () => document.location.reload());
	_provider.autoRefreshOnNetworkChange = false;
}
else
{
	const msg = "Can't find etherium provider! You have to install MetaMask first.";
	alert(msg);
	const msgEl = document.createElement('h4');
	msgEl.style="margin-top: 50px; color: red";
	msgEl.innerHTML = msg;
	_bgDiv.append(msgEl);
	connectBt.hidden = true;
}

function onConnect(accounts)
{
	const account = accounts[0];
	const userState = document.getElementById('connectionInfo');
	userState.innerHTML = `Account: ${account}<br/>`;
	//Вводим входные данные.
	const inputDiv = document.getElementById('inputData');
	inputDiv.hidden = false;
	const contractAddress = document.getElementById('contractAddress');
	const contractAbi = document.getElementById('contractAbi');
	const inputBt = document.getElementById('inputBt');
	inputBt.addEventListener('click', () =>
		{
			_contractAddress = contractAddress.value;
			_contractAbi = contractAbi.value;
			document.getElementById('contractAddress_lb').textContent = 'Contract address: ' + _contractAddress;
			inputDiv.hidden = true;
			onContractInput();
		});
}

function onContractInput()
{
	const web3 = new Web3(Web3.givenProvider);
	const contract = new web3.eth.Contract(JSON.parse(_contractAbi), _contractAddress);
	const clearEventsBt = document.getElementById('clearEvents');
	const pauseResumeBt = document.getElementById('pauseResumeBt');
	const eventsList = [];
	const eventsHolder = document.getElementById('events');
	const scrollToDiv = document.getElementById('scrollToDiv');
	let isPaused = false;
	//Для тестирования.
	//let testEl = document.createElement('li');
	//testEl.innerHTML = `${new Date().toString()} тестирование вывода.`;
	//eventsHolder.append(testEl);
	//Конец тестирования.
	contract.events.allEvents((err, event) =>
		{
			if (!isPaused)
			{
				if (err)
				{
					console.log(err);
				}
				else
				{
					//console.log(event);
					clearEventsBt.hidden = false;
					pauseResumeBt.hidden = false;
					let el = document.createElement('li')
					eventsList.push(el);
					let d = new Date();					
					let dateOptions =
					{
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: 'numeric',
						minute: 'numeric',
						second: 'numeric'
					};
					let aux = `${event.event} (${d.toLocaleString(_lang, dateOptions)}):<br/>`

					for (let param in event.returnValues)
					{
						if (isNaN(Number(param)))
						{
							aux += param + ' = ' + event.returnValues[param] + '<br/>';
						}
					}
					aux = aux.slice(0, aux.length - 5); //Удаляем последнее <br/>
					el.innerHTML = aux; 
					eventsHolder.append(el);
					scrollToDiv.scrollIntoView(false)
				}
			}
		});
	clearEventsBt.addEventListener('click', () =>
		{
			eventsList.forEach(el => el.remove());
			eventsList.length = 0;
			clearEventsBt.hidden = true;
			pauseResumeBt.hidden = true;
		});
	pauseResumeBt.addEventListener('click', () =>
		{
			isPaused = !isPaused;
			pauseResumeBt.innerHTML = isPaused ? 'Resume' : 'Pause';
			clearEventsBt.disabled = isPaused;
		});
}
