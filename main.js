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
const DONATION_ADDRESS = '0x3eCDDfe6c1a705829A2e71c38be40cEB950db865';
const DONATION_COOKIE_NAME = 'donateDone';
const DONATION_COOKIE_EXPIRES_MONTH = 3;
const DONATION_DEFAULT_VALUE = 0.01;
const DEFAULT_LANG = 'en-US'
const MESSAGE_SERVER = 'https://deorathemen.wixsite.com/messages/_functions/msg';
const _provider = window['ethereum'];
const _msgEl = document.getElementById('msg'); //Сообщения, возникающие при взаимодействии с MetaMask.
let _contractAddress;
let _contractAbi;
let _eventsNames = [];
const _bgDiv = document.getElementById('bgDiv'); //Белый фон в центре.

//Зполняем белым фоном центр.
function fillBg()
{
	_bgDiv.style.height = document.documentElement.clientHeight + 'px';
}
fillBg();
window.addEventListener('resize', fillBg);
/***************************/

function getAppPath()
{
	let path = window.location.pathname;
	let aux = path.lastIndexOf('index.html');
	if (aux) return path.slice(0, aux);
	return path;
}

const APP_PATH = getAppPath();
const _lang = navigator.browserLanguage || navigator.language || navigator.userLanguage || DEFAULT_LANG;
let _interfaceLang;
let _infoLang;

start();

async function start()
{
	_interfaceLang = await fetchLang('lang.json', false);
	_infoLang = await fetchLang('info.html', true);
	onTranslationLoad();
}

async function fetchLang(fileName, isText)
{
	let res = await fetch(`${APP_PATH}/lang/${_lang}/${fileName}`);
	if (!res.ok) res = await fetch(`${APP_PATH}/lang/${DEFAULT_LANG}/${fileName}`);
	let type = isText ? res.text : res.json;
	return res.ok ? await type.call(res) : false;
}

function onTranslationLoad()
{
	document.querySelector('head > meta[name="description"]').content = _interfaceLang.description; //Заполняем тег description
	const info = document.getElementById('info');
	info.hidden = false;
	//Checking MetaMask
	if (typeof window.ethereum !== 'undefined')
	{
		//Description
		//Замена <lang: > из info.html на данные из lang.json
		{
			let langStartPos = 0;
			let positions = [];
			while (true)
			{
				langStartPos = _infoLang.indexOf('<lang:', langStartPos);
				if (langStartPos === -1) break;
				let langParamPos = langStartPos + 6;
				let langEndPos = _infoLang.indexOf('>', langStartPos);
				let param = _infoLang.slice(langParamPos, langEndPos);			
				positions.push(
					{
						param: param,
						start: langStartPos,
						end: langEndPos,
					});
				langStartPos++;
			}
			let newInfo = ''
			let pos = 0;
			for (let i = 0; i < positions.length; i++)
			{
				newInfo += _infoLang.slice(pos, positions[i].start);
				newInfo += _interfaceLang[positions[i].param];
				pos = positions[i].end + 1;
			}
			newInfo += _infoLang.slice(pos, _infoLang.length);
			_infoLang = newInfo;
		}
		//***************************************
		info.innerHTML = _infoLang;
		const infoConnectBt = document.getElementById('infoConnectBt');
		if (infoConnectBt) infoConnectBt.innerHTML = _interfaceLang.connectBt;
		const infoStartListenBt = document.getElementById('infoStartListenBt');
		if (infoStartListenBt) infoStartListenBt.innerHTML = _interfaceLang.startListenBt;
		//*******************
		const connectBt = document.getElementById('connectBt');
		connectBt.innerHTML = _interfaceLang.connectBt;
		connectBt.addEventListener('click', () =>
			{
				_msgEl.hidden = false;
				_msgEl.innerHTML = _interfaceLang.waitingMetaMask;
				_provider.enable().then(onConnect).catch((error) => 
					{
						_msgEl.innerHTML = _interfaceLang.metaMaskError + ': ' + error.message;
					});
				connectBt.hidden = true;
				donationBlock.hidden = true;
				info.hidden = true;
			});
		//*******Donation block*******
		const donationBlock = document.getElementById('donationBlock');
		let donationCookie = document.cookie.split(';').find(item => item.split('=')[0] === DONATION_COOKIE_NAME);
		const donateValue = document.getElementById('donateValue');
		if(!donationCookie)
		{
			donationBlock.hidden = false;
			donateValue.value = DONATION_DEFAULT_VALUE;
			const donateBt = document.getElementById('donateBt');
			donateBt.innerHTML = _interfaceLang.donateBt;
			const donateHeader = document.getElementById('donateHeader');
			donateHeader.innerHTML = _interfaceLang.donateHeader;
			const sendMessageToMeHeader = document.getElementById('sendMessageToMeHeader');
			sendMessageToMeHeader.innerHTML = _interfaceLang.donateSendMessageToMeHeader + ':';
			donateBt.addEventListener('click', () =>
				{
					let account;
					let web3
					const donateMsg = document.getElementById('donationStatusMsg');
					donateMsg.hidden = false;
					_provider.enable().then(accounts =>
						{
							account = accounts[0];
							web3 = new Web3(Web3.givenProvider);
							return web3.eth.net.getNetworkType(); 
						}).then(netType =>
						{
							let value = donateValue.value;
							if (netType !== 'main') //'private' - for test
							{
								donateMsg.innerHTML = _interfaceLang.donateNotMainNetwork;
								donateMsg.style = 'color: red';
							}
							else if(isNaN(Number(value)) || Number(value) <= 0)
							{
								donateMsg.innerHTML = _interfaceLang.donateIcorrectValue;
								donateMsg.style = 'color: red';
							}
							else
							{
								web3.eth.sendTransaction(
								{
									from: account,
									to: DONATION_ADDRESS,
									value: web3.utils.toWei(value)
								}, (err, res) =>
								{
									if (err)
									{
										donateMsg.innerHTML = _interfaceLang.metaMaskError + ': ' + err.message;
										donateMsg.style = 'color: red';
									}
									else
									{
										//Транзакция прошла успешно.
										donateBt.hidden = true;
										donateHeader.hidden = true;
										donateValue.hidden = true;
										donateMsg.innerHTML = _interfaceLang.donateThankYou;
										donateMsg.style = 'color: green';
										let expiresDate = new Date();
										expiresDate.setMonth(expiresDate.getMonth() + DONATION_COOKIE_EXPIRES_MONTH);
										sendMessageToMeHeader.hidden = true;
										document.cookie = `${DONATION_COOKIE_NAME}=${value}; expires=${expiresDate.toUTCString()}`;
										const textarea = document.getElementById('messageToMe');
										let text = textarea.value;
										textarea.hidden = true;
										//Отправляем сообщение мне.
										const msg = 
											{
												text: text,
												address: account,
												value: value
											};
										fetch(MESSAGE_SERVER,
											{
												method: 'POST',
												headers:
												{
													'Content-Type': 'text/plain' //'application/json' - not work for wix site (wix send 403 for options requests)
												},
												body: JSON.stringify(msg)
											}).then((res) =>
											{
												if (!res.ok) alert(_interfaceLang.youMessageLost + '.');
											}).catch((err) =>
												{
													alert(_interfaceLang.youMessageLost + ': ' + err);
												});
									}
								});
							}
						}).catch((err) =>
							{
								donateMsg.innerHTML = _interfaceLang.metaMaskError + ': ' + err.message;
								donateMsg.style = 'color: red';
							});
				});
		}
		//*******End donation block*******
		_provider.on('networkChanged', () =>
			{
				document.location.reload();
			});
		_provider.on('accountsChanged', () =>
			{
				document.location.reload();
			});
		_provider.autoRefreshOnNetworkChange = false;
	}
	else
	{
		const msg = _interfaceLang.noProviderError;
		_msgEl.hidden = false;
		alert(msg);
		_msgEl.innerHTML = msg;
		connectBt.hidden = true;
	}
}

function onConnect(accounts)
{
	_msgEl.hidden = true;
	const account = accounts[0];
	const userState = document.getElementById('connectionInfo');
	userState.innerHTML = `${_interfaceLang.accountLb}: ${account}<br/>`;
	//Вводим входные данные.
	const inputDiv = document.getElementById('inputData');
	inputDiv.hidden = false;
	const contractAddress = document.getElementById('contractAddress'); //Поле ввода адреса
	const contractAddressInHeader = document.getElementById('contractAddressInHeader'); //Заголовок поля ввода адреса
	contractAddressInHeader.innerHTML = _interfaceLang.contractAddressIn;
	const contractAbi = document.getElementById('contractAbi'); //Поле ввода ABI
	const contractAbiInHeader = document.getElementById('contractAbiInHeader'); //Заголовок поля ввода ABI
	contractAbiInHeader.innerHTML = _interfaceLang.contractAbiIn;
	const startListenBt = document.getElementById('startListenBt'); //Кнопка пуск
	startListenBt.innerHTML = _interfaceLang.startListenBt;
	startListenBt.addEventListener('click', () =>
		{
			_contractAddress = contractAddress.value;
			_contractAbi = JSON.parse(contractAbi.value);
			document.getElementById('contractAddressLb').textContent = _interfaceLang.contractAddressLb + ': ' + _contractAddress;
			inputDiv.hidden = true;
			onContractInput();
		});
}

function getEventsList(abi)
{
	let out = {};
	abi.forEach(el => 
		{
			if (el.type === 'event') out[el.name] = 0;
		});
	return out;
}

function onContractInput()
{
	const web3 = new Web3(Web3.givenProvider);
	const contract = new web3.eth.Contract(_contractAbi, _contractAddress);
	_eventsNames = getEventsList(_contractAbi); //Получаем объект, в котором ключи - это имена событий, а значения - число таких событий.
	const clearEventsBt = document.getElementById('clearEventsBt');
	clearEventsBt.innerHTML = _interfaceLang.clearListBt;
	const pauseResumeBt = document.getElementById('pauseResumeBt');
	pauseResumeBt.innerHTML = _interfaceLang.pauseBt;
	const eventsList = [];
	const eventsHolder = document.getElementById('events');
	const scrollToDiv = document.getElementById('scrollToDiv');
	let isPaused = false;

	//Для тестирования.
	//let testEl = document.createElement('li');
	//testEl.innerHTML = `${new Date().toString()} тестирование вывода.`;
	//eventsHolder.append(testEl);
	//Конец тестирования.
	
	//Фильтр событий
	const filterTitle = document.querySelector('#eventsFilter > p:first-of-type');
	filterTitle.innerHTML = _interfaceLang.filterTitle;
	let totalEvents = 0;
	let showingEvents = totalEvents;
	document.getElementById('eventsFilter').hidden = false;
	const eventsCounter = document.querySelector('#eventsFilter > p:last-of-type');
	updateCounter();
	const eventsSelector = document.querySelector('#eventsFilter > div:first-of-type');
	let eventsNamesCb = {}; //Объект, где ключи - имена событий, а значения - объект, содержащий checkbox и текст к нему.
	for (let name in _eventsNames)
	{
		//checkbox
		let auxElement = document.createElement('input');
		auxElement.type = 'checkbox';
		auxElement.checked = true;
		auxElement.value = name;
		eventsNamesCb[name] = {checkbox: {}, span: {}};
		eventsNamesCb[name].checkbox = auxElement;
		auxElement.addEventListener('change', () =>
			{
				eventsList.forEach(event =>
					{
						if (event.eventName === name) 
						{
							let checked = eventsNamesCb[name].checkbox.checked;
							togleListItem(checked, event.eventListElement);
							if (checked)
							{
								showingEvents++;
							}
							else
							{
								showingEvents--;
							}
						}
					});
				updateCounter();
			});
		//Текст checkbox'а
		auxElement = document.createElement('span');
		auxElement.innerHTML = `${name} (${_eventsNames[name]})`;
		eventsNamesCb[name].span = auxElement;
		auxElement = document.createElement('div'); //Поместим чекбокс и текст к нему в отдельный div, чтобы управлять им через css.
		auxElement.append(eventsNamesCb[name].checkbox);
		auxElement.append(eventsNamesCb[name].span);
		eventsSelector.append(auxElement);
	}
	selectAllBt = document.getElementById('selectAllBt');
	selectAllBt.hidden = false;
	selectAllBt.innerHTML = _interfaceLang.selectAllBt;
	selectAllBt.addEventListener('click', () =>
		{
			for (let name in eventsNamesCb) eventsNamesCb[name].checkbox.checked = true;
			for (let event of eventsList) togleListItem(true, event.eventListElement);
			showingEvents = totalEvents;
			updateCounter();
		});
	unselectAllBt = document.getElementById('unselectAllBt');
	unselectAllBt.hidden = false;
	unselectAllBt.innerHTML = _interfaceLang.unselectAllBt;
	unselectAllBt.addEventListener('click', () =>
		{
			for (let name in eventsNamesCb) eventsNamesCb[name].checkbox.checked = false;
			for (let event of eventsList) togleListItem(false, event.eventListElement);
			showingEvents = 0;
			updateCounter();
		});
	//*******************
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
					totalEvents++;
					let d = new Date();
					let el = document.createElement('li')
					eventsList.push({eventName: event.event, eventListElement: el});
					let dateOptions =
						{
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: 'numeric',
							minute: 'numeric',
							second: 'numeric'
						};
					let auxHtml = `${event.event} (${d.toLocaleString(_lang, dateOptions)}):<br/>`
					for (let param in event.returnValues)
					{
						if (isNaN(Number(param)))
						{
							auxHtml += param + ' = ' + event.returnValues[param] + '<br/>';
						}
					}
					auxHtml = auxHtml.slice(0, auxHtml.length - 5); //Удаляем последнее <br/>
					el.innerHTML = auxHtml; 
					_eventsNames[event.event]++;
					eventsNamesCb[event.event].span.innerHTML = `${event.event} (${_eventsNames[event.event]})`;

					clearEventsBt.hidden = false;
					pauseResumeBt.hidden = false;
					eventsHolder.append(el);
					let visibility = isEventSelected(event.event);
					togleListItem(visibility, el);
					if (visibility)	
					{
						scrollToDiv.scrollIntoView(false);
						showingEvents++;
					}
					updateCounter();
				}
			}
		});
		clearEventsBt.addEventListener('click', () =>
		{
			eventsList.forEach(event => event.eventListElement.remove());
			eventsList.length = 0;
			clearEventsBt.hidden = true;
			pauseResumeBt.hidden = true;
			totalEvents = 0;
			showingEvents = 0;
			updateCounter();
			for (name in _eventsNames) _eventsNames[name] = 0;
			for (name in eventsNamesCb) eventsNamesCb[name].span.innerHTML = `${name} (0)`;
		});
	pauseResumeBt.addEventListener('click', () =>
		{
			isPaused = !isPaused;
			pauseResumeBt.innerHTML = isPaused ? _interfaceLang.resumeBt : _interfaceLang.pauseBt;
			clearEventsBt.disabled = isPaused;
		});

	function isEventSelected(eventName)
	{
		for (let name in eventsNamesCb)
		{
			let el = eventsNamesCb[name].checkbox;
			if (el.value === eventName) return el.checked;
		}
		return false;
	}

	function updateCounter()
	{
		if (totalEvents === 0)
		{
			eventsCounter.innerHTML =_interfaceLang.noEventsMsg; 
		}
		else
		{
			eventsCounter.innerHTML = `${_interfaceLang.showingMsg} ${showingEvents} ${_interfaceLang.from} ${totalEvents}`;
		}
	}
}

function togleListItem(visibility, element)
{
	element.style = visibility ? 'display: list-item' : 'display: none';
}
