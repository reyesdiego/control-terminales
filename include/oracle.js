/**
 * Created by diego on 1/16/15.
 */


var oracleUtils = function (){

}

oracleUtils.prototype = {

	orderBy : function (order) {
		var orderBy = '';
		var orderType='ASC';
		if (order) {

			var _orderBy = JSON.parse(order);

			for (var i= 0, len = _orderBy.length; i < len; i++)
				for (var prop in _orderBy[i]){
					if (_orderBy[i][prop] === -1) orderType = 'DESC';
					orderBy = prop + ' ' + orderType;
				}
		} else {
			orderBy = 'ID ASC';
		}
		return orderBy;

	}
}

module.exports = oracleUtils;
