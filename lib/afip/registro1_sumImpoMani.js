/**
 * Created by diego on 27/12/16.
 */

"use strict";

class Registro1SumImpoMani {
    constructor (connection) {
        this.cn = connection;
    }

    getShipsTrips (params) {
        return new Promise((resolve, reject) => {
            this.cn.pool.getConnection((err, connection) => {
                var strSql = '';
                if (err) {
                    console.log(err, "Error acquiring from pool.");
                    reject({ status: 'ERROR', message: err.message, data: err });
                } else {
                    strSql = "select nombrebuque buque, fechaarribo fecha, count(*) cnt " +
                        "    from registro1_sumimpomani " +
                        "    group by nombrebuque, fechaarribo " +
                        "    order by nombrebuque,fechaarribo";

                    connection.execute(strSql, [], (err, data) => {
                        var Enumerate,
                            dataQ,
                            result;

                        if (err) {
                            this.cn.doRelease(connection);
                            reject({ status: 'ERROR', message: err.message, data: err });
                        } else {
                            this.cn.doRelease(connection);
                            Enumerate = require("linq");
                            dataQ = Enumerate.from(data.rows);
                            result = dataQ.select(function (item) {
                                return { "buque": item.BUQUE, fecha: item.FECHA};
                            }).toArray();

                            result = {status: "OK", totalCount : result.length, data : result};
                            resolve(result);
                        }
                    });
                }
            });
        });
    }
}


module.exports = Registro1SumImpoMani;