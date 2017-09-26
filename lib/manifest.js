/**
 * Created by diego on 11/08/17.
 */
"use strict";

class Manifest {
    constructor (oracle) {
        this.cn = oracle;
    }

    getSumariaImpo (params) {
        return new Promise((resolve, reject) => {
            var strSql;
            var strWhere = '';
            var Enumerable = require("linq");
            var pool = this.cn.pool;

            if (pool) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.log("%s, Error en Oracle Adding Ship Entrace in OracleDb.", new Date());
                        this.cn.doRelease(connection);
                        reject({status: "ERROR", message: "Error en Oracle addInvoice", data: err});

                    } else {

                        if (params.contenedor !== undefined) {
                            strWhere += ` CONTENEDOR = '${params.contenedor}' AND `;
                        }

                        if (params.sumaria !== undefined) {
                            strWhere += ` R4.SUMARIA = '${params.sumaria}' AND `;
                        }
                        if (strWhere.length > 0) {
                            strWhere = ` WHERE ${strWhere.substr(0, strWhere.length-4)}`;
                        }

                        strSql = `SELECT R4.SUMARIA, R1.NOMBREBUQUE, FECHAARRIBO, R4.CONOCIMIENTO, CONTENEDOR, MEDIDA,CONDICION, R4.PTOEMBARQUE, R3.PESO
                                    FROM REGISTRO4_SUMIMPOMANI R4
                                      INNER JOIN REGISTRO3_SUMIMPOMANI R3 ON R3.SUMARIA = R4.SUMARIA AND R3.CONOCIMIENTO = R4.CONOCIMIENTO
                                      INNER JOIN REGISTRO2_SUMIMPOMANI R2 ON R2.SUMARIA = R4.SUMARIA AND R2.CONOCIMIENTO = R4.CONOCIMIENTO
                                      INNER JOIN REGISTRO1_SUMIMPOMANI R1 ON R1.SUMARIA = R4.SUMARIA
                                    ${strWhere}
                                    GROUP BY R4.SUMARIA, R1.NOMBREBUQUE, FECHAARRIBO, R4.CONOCIMIENTO, CONTENEDOR, MEDIDA,CONDICION, R4.PTOEMBARQUE, R3.PESO`;
                        connection.execute(strSql, [], {}, (err, data) => {
                            if (err) {
                                this.cn.doRelease(connection);
                                reject({
                                    status: "ERROR",
                                    message: err.message
                                });
                            } else {
                                var bl,
                                    bls;
                                var result = Enumerable.from(data.rows)
                                .groupBy('x=>JSON.stringify({sumaria: x.SUMARIA,fechaArribo: x.FECHAARRIBO, buque: x.NOMBREBUQUE})', null, (key, g) => {
                                        key = JSON.parse(key);

                                        bls = Enumerable.from(g.getSource())
                                            .groupBy('x=>JSON.stringify({bl: x.CONOCIMIENTO, peso: x.PESO})', null, (key2, g2) => {
                                                key2 = JSON.parse(key2);
                                                let pesoUni = key2.peso / g2.count();
                                                return {
                                                    bl: key2.bl,
                                                    peso: key2.peso,
                                                    containers: g2.getSource().map(item => ({
                                                        contenedor: item.CONTENEDOR,
                                                        peso: pesoUni,
                                                        ptoEmbarque: item.PTOEMBARQUE
                                                    }))
                                                };
                                            }).toArray();

                                         return {
                                             sumaria: key.sumaria,
                                             buque: key.buque,
                                             fecha: key.fechaArribo,
                                             bls: bls
                                         };
                                    })
                                .toArray();
                                resolve({
                                    status: "OK",
                                    data: result
                                });
                            }
                        });
                    }
                });
            }
        });
    }
}

module.exports = Manifest;