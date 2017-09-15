/**
 * Created by diego on 14/08/17.
 */
"use strict";

class Registro3SumImpoMani {
    constructor (connection) {
        this.cn = connection;
    }

    getByBl(bl) {
        return new Promise((resolve, reject) => {
            this.cn.pool.getConnection((err, connection) => {
                var strSql = '';
                if (err) {
                    console.log(err, "Error acquiring from pool.");
                    reject({ status: 'ERROR', message: err.message, data: err });
                } else {
                    strSql = `SELECT *
                                FROM REGISTRO3_SUMIMPOMANI
                                WHERE CONOCIMIENTO = :1`;

                    connection.execute(strSql, [bl], (err, data) => {
                        var result;

                        this.cn.doRelease(connection);
                        if (err) {
                            reject({ status: 'ERROR', message: err.message, data: err });
                        } else {
                            result = data.rows.map(item => ({
                                conocimiento: item.CONOCIMIENTO,
                                sumaria: item. SUMARIA,
                                peso: item.PESO
                            }));

                            result = {status: "OK", totalCount : result.length, data : result};
                            resolve(result);
                        }
                    });
                }
            });
        });
    }

}


module.exports = Registro3SumImpoMani;