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
			for (var i= 0, len = order.length; i < len; i++)
				for (var prop in order[i]){
					if (order[i][prop] === -1) orderType = 'DESC';
					orderBy = prop + ' ' + orderType;
				}
		} else {
			orderBy = 'ID ASC';
		}
		return orderBy;

	}
}

module.exports = oracleUtils;
