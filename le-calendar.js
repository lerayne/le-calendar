/**
 * Created by IntelliJ IDEA.
 * User: Michael Yegorov (under M. Yegorov)
 * Date: 7/23/12
 * Time: 2:15 PM
 * To change this template use File | Settings | File Templates.
 */

var inArray = function (val, array) {
	for (var i = 0; i < array.length; i++) {
		if (val == array[i]) return true;
	}
	return false;
}

if (typeof(anrom)== 'undefined') anrom = {};

anrom.leadzero = function (num, count) {
// count - максимальное число нулей, а не разрядность числа! т.е. "разрядность-1"
// если не указано - равно 1

	if (typeof count == 'undefined') var count = 1;
	if (typeof num == 'string') num = parseInt(num,10);

	var str = num + '';
	while (num < Math.pow(10, count) && count > 0) {
		str = '0' + str;
		count--;
	}
	return str;
}

anrom.Calendar = function (date, options, actions) {

	// опции по умолчанию
	this.options = {
		locale:'en',
		weekStarts:0,
		holidays:[0, 6],
		aniSpeed:400,
		minYear:0,
		yearSpan:40,
		order:'ymd'
	}

	this.currentPosition = false;

	// замещение опций
	for (var key in options) this.options[key] = options[key];

	// проксирование функций из Actions
	this.actions = {};
	this.actions.dayCell = {};

	/*if (actions) {
	 for (var object in actions) {

	 if (typeof actions[object] == 'function') {

	 this.actions[object] = $j.proxy(actions[object], this)

	 } else if (typeof actions[object] == 'object') {

	 this.actions[object] = {};

	 for (var action in actions[object]) {
	 this.actions[object][action] = $j.proxy(actions[object][action], this);
	 }
	 }
	 }
	 }*/

	this.actions = actions;

	// Языковые данные

	this.txt = {}

	this.txt.days = {
		en:['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		ru:['Вс', "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
	}

	this.txt.months = {
		en:['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		ru:['Январь', "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
	}

	for (var i = 0, daysString = '', daynum, holiday; i < 7; i++) {
		daynum = this.cycle(i + (this.options.weekStarts), 6);
		holiday = (inArray(daynum, this.options.holidays)) ? ' holiday' : '';
		daysString += '<div class="anr-cal-cell' + holiday + '"><div>' + this.txt.days[this.options.locale][daynum] + '</div></div>'
	}

	// Шаблон

	this.ui = {}

	this.ui.$tpl = $j('<div class="anrom-calendar">' +
		'<div class="controls">' +
		'<a class="anr-cal-cell dir-btn prev-year"><div>&laquo;</div></a>' +
		'<a class="anr-cal-cell dir-btn prev-month"><div>&lsaquo;</div></a>' +
		'<div class="current-month-wrp"><div class="current-month"></div></div>' +
		'<a class="anr-cal-cell dir-btn next-year"><div>&raquo;</div></a>' +
		'<a class="anr-cal-cell dir-btn next-month"><div>&rsaquo;</div></a>' +
		'<div class="clearfix"></div>' +
		'</div>' +
		'<div class="day-names">' +
		daysString +
		'<div class="clearfix"></div>' +
		'</div>' +
		'<div class="body">' +
		'</div>' +
		'<div class="clearfix"></div>' +
		'</div>'
	);

	this.ui.$prevYear = this.ui.$tpl.find('.prev-year');
	this.ui.$nextYear = this.ui.$tpl.find('.next-year');
	this.ui.$prevMonth = this.ui.$tpl.find('.prev-month');
	this.ui.$nextMonth = this.ui.$tpl.find('.next-month');
	this.ui.$cuurentMonth = this.ui.$tpl.find('.current-month');
	this.ui.$body = this.ui.$tpl.find('.body');

	this.blockSwitch = false;

	// Проксирование родных функций

	this.dayClick = $j.proxy(this, 'dayClick');
	this.endSwitch = $j.proxy(this, 'endSwitch');

	// Привязка к кнопкам переключения месяцев/лет

	var that = this;

	this.ui.$prevYear.click(function () {
		that.switchMonth(-1, 0);
		return false;
	});
	this.ui.$prevMonth.click(function () {
		that.switchMonth(0, -1);
		return false;
	});
	this.ui.$nextMonth.click(function () {
		that.switchMonth(0, 1);
		return false;
	});
	this.ui.$nextYear.click(function () {
		that.switchMonth(1, 0);
		return false;
	});

	// после инициализации

	this.today = new Date();
	this.selectedDate = new Date(date);

	this.currentMonth = this.createMonth(
		this.selectedDate.getFullYear(),
		this.selectedDate.getMonth()
	);

	this.selectDate(this.selectedDate);
}

anrom.Calendar.prototype = {
	appendTo:function ($parent) {
		this.ui.$tpl.appendTo($parent);
		this.setMonthHeight(this.currentMonth.height());
	},

	createMonth:function (year, month) {
		var $monthBody = $j('<div class="month-body">');

		// тут будет двумерный массив дат текущего месяцеблока
		this.currentMonthDays = {}

		var days = [];
		var thisDate = new Date(year, month);
		thisDate.setHours(13);

		var firstDayOfMonth = this.getDOW(thisDate.getDay() - this.options.weekStarts);
		var daysOfPrevMonth = firstDayOfMonth;
		var thisMonth = thisDate.getMonth();

		if (daysOfPrevMonth) {
			// внимание! дата изменяется! Переходим на нужную дату предыдущего месяца
			thisDate.setDate(0)
			var temp = thisDate.getDate() - daysOfPrevMonth + 1;
			thisDate.setDate(temp);

			// Дни предыдущео месяца
			for (var i = thisDate.getDate(); (thisDate.getMonth() < thisMonth || thisDate.getMonth() - thisMonth == 11); thisDate.setDate(++i)) {
				days.push(this.createDay(thisDate, thisMonth));
			}
		}

		for (var i = thisDate.getDate(); thisDate.getMonth() == thisMonth; thisDate.setDate(++i)) {
			days.push(this.createDay(thisDate, thisMonth));
		}

		// если остались дни
		if (days.length % 7) {
			var remain = (Math.ceil(days.length / 7) * 7) - days.length;

			for (var i = thisDate.getDate(); thisDate.getDate() <= remain; thisDate.setDate(++i)) {
				days.push(this.createDay(thisDate, thisMonth));
			}
		}

		for (var i = 0; i < days.length; i++) $monthBody.append(days[i]);
		$monthBody.append($j('<div class="clearfix"></div>'))

		this.ui.$body.append($monthBody);

		var that = this;

		setTimeout(function () {
			that.setMonthHeight($monthBody.height());
		});

		this.ui.$cuurentMonth.children().remove();
		this.ui.$cuurentMonth.append($j('<span>'+ this.txt.months[this.options.locale][month] +' </span>'));
		this.ui.$cuurentMonth.append(this.createYearsDD(year))

		if (this.actions.createMonth) this.actions.createMonth();

		return $monthBody;
	},

	createYearsDD:function(year) {

		//anrom.log(year)

		var that = this;

		var $select = $j('<select>');

		var cd = new Date();
		var curYear = cd.getFullYear();
		var minYear = curYear + this.options.minYear;
		var maxYear = minYear - this.options.yearSpan;

		if (year > minYear) {
			$j('<option selected="selected">'+year+'</option>').appendTo($select);
		}

		for (var y = minYear; y > maxYear; y--){
			var option = $j('<option>'+y+'</option>').appendTo($select);
			if (y == year) option.attr('selected', true);
			//anrom.log('year:', year, ', y:', y, ',', (y == year));
		}

		if (year <= maxYear) {
			$j('<option selected="selected">'+year+'</option>').appendTo($select);
		}

		var options = $select.children();

		$select.click(function(){
			var y = $j(this).find(':selected').val();
			that.setDate(new Date(y, that.selectedDate.getMonth(), that.selectedDate.getDate()))
			that.checkForToday();
			return false;
		})

		return $select;
	},

	setMonthHeight:function(height){
		//console.log(height);
		this.ui.$body.animate({height:height});
	},

	createDay:function (thisDate, thisMonth) {
		var thisDate = new Date(thisDate);

		var year = thisDate.getFullYear()
		var month = thisDate.getMonth();
		var date = thisDate.getDate();

		var $cell = $j('<div class="anr-cal-cell"><div>' + date + '</div></div>');

		if (month > thisMonth) $cell.addClass('other-month next');
		if (month < thisMonth) $cell.addClass('other-month prev');

		if (inArray(thisDate.getDay(), this.options.holidays) || false) $cell.addClass('holiday');

		if (this.today.getFullYear() == thisDate.getFullYear() &&
			this.today.getMonth() == month &&
			this.today.getDate() == date) {
			$cell.addClass('today');
		}

		$cell.bind('click', {date:thisDate}, this.dayClick);

		for (var action in this.actions.dayCell) {
			$cell.bind(action, {target:$cell, date:thisDate, calendar:this}, this.actions.dayCell[action]);
		}

		if (typeof this.currentMonthDays[year] == 'undefined') this.currentMonthDays[year] = {}
		if (typeof this.currentMonthDays[year][month + 1] == 'undefined') this.currentMonthDays[year][month + 1] = {}
		this.currentMonthDays[year][month + 1][date] = $cell;
		return $cell;
	},

	dayClick:function (e) {
		this.selectDate(e.data.date);
		if (this.actions.dayClick) this.actions.dayClick();
		return false;
	},

	selectDate:function (date) {
		this.selectedDate = date;

		if (this.actions.selectDate) this.actions.selectDate(this.selectedDate)

		var $dayCell = this.getDay(this.selectedDate);
		this.ui.$body.find('.selected').removeClass('selected');
		$dayCell.addClass('selected');
	},

	getDay:function (date) {
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = date.getDate();

		if (typeof this.currentMonthDays[year] != 'undefined'
			&& typeof this.currentMonthDays[year][month] != 'undefined'
			&& typeof this.currentMonthDays[year][month][day] != 'undefined') {
			return this.currentMonthDays[year][month][day];
		} else
			return false;
	},

	switchMonth:function(toYear, toMonth){
		if (!this.blockSwitch){
			this.blockSwitch = true;

			var $day = this.getDay(this.selectedDate);
			var forced;
			if (($day.hasClass('prev') && toMonth < 0) || ($day.hasClass('next') && toMonth < 0)) {toMonth = toMonth+1; forced = true;}
			if (($day.hasClass('prev') && toMonth > 0) || ($day.hasClass('next') && toMonth > 0)) {toMonth = toMonth-1; forced = true;}

			this.setDate(new Date(this.selectedDate.getFullYear() + toYear, this.selectedDate.getMonth() + toMonth), forced);
			this.checkForToday();
		}
	},

	setDate:function (date, forced) {

		if (forced || date.getMonth() != this.selectedDate.getMonth()
			|| date.getFullYear() != this.selectedDate.getFullYear()) {

			this.prevMonth = this.currentMonth;

			this.currentMonth = this.createMonth(
				date.getFullYear(),
				date.getMonth()
			);

			if (this.actions.changeMonth) this.actions.changeMonth();

			var side = (date.getTime() > this.selectedDate.getTime()) ? ['right', 'left'] : ['left', 'right'];
			if (forced) side = ['top', 'bottom'];

			this.currentMonth.css(side[0], '-100%');
			this.prevMonth.css(side[1], 0);
			var obj1 = {};
			obj1[side[0]] = 0;
			var obj2 = {};
			obj2[side[1]] = '-100%';
			this.currentMonth.animate(obj1, this.options.aniSpeed, this.endSwitch);
			this.prevMonth.animate(obj2, this.options.aniSpeed-100);
		}

		this.selectDate(date);
	},

	endSwitch:function () {
		this.currentMonth.removeAttr('style');
		this.prevMonth.remove();
		this.blockSwitch = false;
	},

	checkForToday:function () {
		this.today = new Date();
		if (this.today.getMonth() == this.selectedDate.getMonth() && this.today.getFullYear() == this.selectedDate.getFullYear())
			this.selectDate(this.today)
	},

	cycle:function (num, maxNum) {
		var maxNum = maxNum + 1;
		var times = Math.floor(num / maxNum);
		return num - (times * maxNum);
	},

	// get Day Of Week
	getDOW:function (num) {
		return this.cycle(num, 6)
	}
}



// CLASS dropdown calendar

anrom.CalendarDrop = function(date, options, actions){
	anrom.bind(this); var $ = jQuery, that = this;

	this.addTime = options.addTime ? true : false;

	this.actions = {
		dayClick:this.dayClick
	}
	for (var i in actions) this.actions[i] = actions[i]

	this.calendar = new anrom.Calendar(date, options, this.actions);

	this.calendarWrap = $('<div class="calendarWrap"></div>');

//	this.timeWrap = this.addTime ? $('<div class="timeWrap">').appendTo(this.calendarWrap) : $([]);

	this.calendar.appendTo(this.calendarWrap);

	$('body').click(this.calendarHide);
}

anrom.CalendarDrop.prototype = {

	attachTo:function(element){
		var that = this, $ = jQuery;

		element
			.focus(function(){
				that.calendarShow(element);
			})
			.click(this.stop)
			.keypress(this.calendarType)

	},

	dayClick:function () {
		if (!!this.calendarWrap) {

			console.log('currentPosition', this.calendar.currentPosition);

			this.calendar.currentPosition.val(this.dateToString(this.calendar.selectedDate, this.calendar.options.order))
			this.calendar.currentPosition.change();
			this.calendarHide();
		}
	},

	dateToString:function (date, order) {

		var output = '';

		if (typeof order == 'undefined') var order = 'dmy';

		if (order == 'ymd') {
			output += date.getFullYear() + '.' + anrom.leadzero(date.getMonth() + 1) + '.' + anrom.leadzero(date.getDate());
		} else if (order == 'dmy') {
			output += anrom.leadzero(date.getDate()) + '.' + anrom.leadzero(date.getMonth() + 1) + '.' + date.getFullYear();
		}

		if (typeof this.addTime == 'string') output += ' ' + this.addTime;
		else if (this.addTime) output += ' ' + anrom.leadzero(date.getHours()) + ':' + anrom.leadzero(date.getMinutes());
		return output;
	},

	stringToDate:function (str, order) {
		var dt = str.split(' ');
		var dateStr = dt[0];


		var chunks = dateStr.split('.');
		if (chunks.length != 3) return false;

		if (typeof order == 'undefined') var order = 'dmy';

		if (order == 'ymd') {
			var date = new Date(parseInt(chunks[0], 10), parseInt(chunks[1], 10) - 1, parseInt(chunks[2], 10));
		} else if (order == 'dmy') {
			var date = new Date(parseInt(chunks[2], 10), parseInt(chunks[1], 10) - 1, parseInt(chunks[0], 10));
		}

		if (isNaN(date.getTime())) return false;

		console.log('date', date)

		return date;
	},

	isShown:function(){
		return this.calendarWrap.is(':visible');
	},

	calendarShow:function (element, calendar) {

//		console.log('calendarShow')

		if (this.isShown()) this.calendarHide();

		this.calendar.currentPosition = element;

		var container = element.parent();
		container.css({position:'relative'});

		this.calendarWrap.show().appendTo(container);
		this.calendar.setMonthHeight(this.calendar.currentMonth.height());

		this.calendarUpdate();

		return false;
	},

	calendarHide:function() {

//		console.log('calendarHide')

		this.calendarWrap.hide();
		this.calendar.currentPosition = false;
	},

	stop:function () {

//		console.log('stop')

		return false;
	},

	calendarUpdate:function () {
		var val = this.calendar.currentPosition.val();
		var dateSet = this.stringToDate(val, this.calendar.options.order);
		var time = val.split(' ')[1];
		if (this.addTime) this.addTime = time ? time : true;
		if (dateSet) this.calendar.setDate(dateSet);
	},

	calendarType:function () {
		if (!!this.typeTimer) clearTimeout(this.typeTimer);
		this.typeTimer = setTimeout(this.calendarUpdate, 2000);
	},

	hideOthers:function(){
		for (var i in arguments){
			var instance = arguments[i];
			if (instance.isShown()) instance.calendarHide();
		}
	}

}
