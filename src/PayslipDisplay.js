import React from "react"
import { Divider, InputNumber, Card, Row, Col, Statistic } from 'antd';
function countCertainDays(days, d0, d1) {
    var ndays = 1 + Math.round((d1 - d0) / (24 * 3600 * 1000));
    var sum = function (a, b) {
        return a + Math.floor((ndays + (d0.getDay() + 6 - b) % 7) / 7);
    };
    return days.reduce(sum, 0);
}
export default class PayslipDisplay extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            vacationDays: 0
        }
    }
    calculateDueDays() {
        if (!this.props.periodEnd) return
        return countCertainDays([1, 2, 3, 4, 5], new Date(2019, 8, 16), this.props.periodEnd)
    }

    calculateOwedDays() {
        return this.calculateDueDays() - this.state.vacationDays - this.props.ytdWages / 320
    }


    render() {
        return (<div style={{ padding: '30px' }}>
            <Card title="Earnings - From Start of Internship until Uploaded Payslip" >
                <Row type="flex" justify="space-around">
                    <Col span={4}>
                        <Statistic precision={2} title="Total Gross Wages" value={this.props.ytdWages} prefix="$" />
                    </Col>
                    <Col span={4}>
                        <Statistic precision={2} title="Other Benefits" value={this.props.ytdOtherBenefits} prefix="$" />
                    </Col>
                </Row>
            </Card>
            <Card style={{ marginTop: "40px" }} title="Taxes - From Start of Internship until Uploaded Payslip" >
                <Row type="flex" justify="space-around">
                    <Col span={4}>
                        <Statistic precision={2} title="Taxes Withheld" value={this.props.ytdPaidTaxes} prefix="$" />
                    </Col>
                    <Col span={4}>
                        <Statistic precision={2} title="Taxes Due" value={this.props.ytdOwedTaxes} prefix="$" />
                    </Col>
                    <Col>
                        <Statistic precision={2} valueStyle={{ color: '#3f8600' }}
                            title="Tax Refund" value={(this.props.ytdPaidTaxes - this.props.ytdOwedTaxes) || 0} prefix="$" />
                    </Col>
                </Row>
            </Card>
            <Card style={{ marginTop: "40px" }} title="Day Checker" >
                <Row type="flex" justify="space-around">
                    <Col span={4}>
                        <span className="ant-statistic-title">Unpaid Vacation Days</span> <br />
                        <InputNumber
                            style={{ width: "27%", marginTop: "8px" }} defaultValue={0}
                            onChange={value => this.setState({ vacationDays: value })} min={0}
                        />
                        <span style={{ marginLeft: "8px", color: "rgba(0, 0, 0, 0.85)" }} className="ant-statistic-content-suffix">days</span>

                    </Col>
                    <Col span={4}>
                        <Statistic precision={0} title="Days Paid" value={(this.props.ytdWages / 320) || 0} suffix="days" />
                    </Col>
                    <Col span={4}>
                        <Statistic precision={0} title="Days Due" value={(this.calculateDueDays() - this.state.vacationDays) || 0} suffix="days" />
                    </Col>
                    <Divider style={{ marginBottom: "-10px", fontSize: "75px" }} type="vertical" />
                    <Col >
                        <Statistic valueStyle={{ color: '#3f8600' }}
                            title="Days SAP Still Owes You" value={this.calculateOwedDays() || 0} suffix="days" />
                    </Col>
                </Row>
            </Card>
        </div >
        )
    }
}