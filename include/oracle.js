/**
 * Created by diego on 1/16/15.
 */

var oracleUtils = function () {
    'use strict';
    this.oracledb = require('oracledb');
    this.oracledb.outFormat = this.oracledb.OBJECT;
    //this.oracledb.outFormat = this.oracledb.ARRAY;
    this.pool;
};

oracleUtils.prototype = {

    doRelease: function (connection) {
        'use strict';
        connection.release(
            function (err) {
                if (err) {
                    console.error(err.message);
                }
            });
    },
    orderBy : function (order) {
        'use strict';
        var orderBy = '',
            orderType = 'ASC';
        if (order) {

            order = JSON.parse(order);

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
