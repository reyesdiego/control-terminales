/**
 * Created by diego on 14/08/17.
 */
"use strict";

class Registro4SumExpoMane {
    constructor (connection) {
        this.cn = connection;
    }

    getByContenedor(contenedor) {
        return new Promise((resolve, reject) => {
            this.cn.pool.getConnection((err, connection) => {
                var strSql = "";
                if (err) {
                    console.log(err, "Error acquiring from pool.");
                    reject({ status: "ERROR", message: err.message, data: err });
                } else {
                    strSql = `SELECT *
                                FROM REGISTRO4_SUMEXPOMANE
                                WHERE CONTENEDOR = :1`;

                    connection.execute(strSql, [contenedor], (err, data) => {
                        var result;

                        this.cn.doRelease(connection);
                        if (err) {
                            reject({ status: "ERROR", message: err.message, data: err });
                        } else {
                            result = data.rows.map(item => ({
                                conocimiento: item.CONOCIMIENTO,
                                sumaria: item. SUMARIA,
                                contenedor: item.CONTENEDOR,
                                medida: item.MEDIDA
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

module.exports = Registro4SumExpoMane;