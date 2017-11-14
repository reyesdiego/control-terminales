/**
 * Created by diego on 14/08/17.
 */
"use strict";

class Registro4SumImpoMani {
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
                    strSql = `SELECT R1.SUMARIA, R1.FECHAARRIBO, R1.FECHAREGISTRO, R4.CONOCIMIENTO, R4.CONTENEDOR, R4.MEDIDA, R4.CONDICION, R4.PTOEMBARQUE
                                FROM REGISTRO4_SUMIMPOMANI R4
                                    INNER JOIN REGISTRO1_SUMIMPOMANI R1 ON R4.SUMARIA = R1.SUMARIA
                                WHERE CONTENEDOR = :1`;

                    connection.execute(strSql, [contenedor], (err, data) => {
                        var result;

                        this.cn.doRelease(connection);
                        if (err) {
                            reject({ status: "ERROR", message: err.message, data: err });
                        } else {
                            result = data.rows.map(item => ({
                                tipo: "IMPO",
                                fechaArribo: item.FECHAARRIBO,
                                fechaRegistro: item.FECHAREGISTRO,
                                conocimiento: item.CONOCIMIENTO,
                                sumaria: item.SUMARIA,
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


module.exports = Registro4SumImpoMani;