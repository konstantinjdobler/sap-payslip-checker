import React from "react"
import { Divider, InputNumber, Card, Row, Col, Statistic } from 'antd';
import {publicHolidays} from './utils/publicHolidays'

function getBusinessDatesCount(startDate, endDate, holidays=[]) {
    let count = 0;
    let curDate = startDate;
    while (curDate <= endDate) {
        let dayOfWeek = curDate.getDay();
        if(dayOfWeek !== 6 && dayOfWeek !== 0 && !holidays.includes(curDate))
           count++;
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}

const GOOD_COLOR = '#3f8600'
const BAD_COLOR = '#ab4e52'
const OK_COLOR = '#f3ca04'
export default class PayslipDisplay extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            vacationDays: 0
        }
    }
    calculateDueDays() {
        if (!this.props.periodEnd) return
        return getBusinessDatesCount(new Date(2019, 8, 16), this.props.periodEnd, publicHolidays)
    }

    calculateOwedDays() {
        return this.calculateDueDays() - this.state.vacationDays - this.props.ytdWages / 320
    }

    valueColor(number, biggerIsBetter = true) {
        if (isNaN(number)) return
        if (number === 0) return OK_COLOR
        if (biggerIsBetter) return number > 0 ? GOOD_COLOR : BAD_COLOR;
        else return number < 0 ? GOOD_COLOR : BAD_COLOR;

    }
    render() {
        return (<div style={{ padding: '30px' }}>
            <Card title="Earnings - From Start of Internship until Uploaded Payslip" >
                <Row type="flex" justify="space-around">
                    <Col span={4}>
                        <Statistic precision={2} title="Total Gross Wages Paid To You" value={this.props.ytdWages} prefix="$" />
                    </Col>
                    <Col span={4}>
                        <Statistic precision={2} title="Other Benefits Paid To You" value={this.props.ytdOtherBenefits} prefix="$" />
                    </Col>
                </Row>
            </Card>
            <Card style={{ marginTop: "40px" }} title="Taxes - From Start of Internship until Uploaded Payslip" >
                <Row type="flex" justify="space-around">
                    <Col span={4}>
                        <Statistic precision={2} title="Taxes Withheld From You" value={this.props.ytdPaidTaxes} prefix="$" />
                    </Col>
                    <Col span={4}>
                        <Statistic precision={2} title="Taxes You Really Have To Pay" value={this.props.ytdOwedTaxes} prefix="$" />
                    </Col>
                    <Divider style={{ marginBottom: "-10px", fontSize: "75px" }} type="vertical" />

                    <Col>
                        <Statistic precision={2} valueStyle={{ color: this.valueColor(this.props.ytdPaidTaxes - this.props.ytdOwedTaxes) }}
                            title="Your Tax Refund" value={(this.props.ytdPaidTaxes - this.props.ytdOwedTaxes) || 0} prefix="$" />
                    </Col>
                </Row>
            </Card>
            <Card style={{ marginTop: "40px" }} title="Day Checker - From Start of Internship until Uploaded Payslip" >
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
                        <Statistic precision={0} title="Days Paid by SAP" value={(this.props.ytdWages / 320) || 0} suffix="days" />
                    </Col>
                    <Col span={4}>
                        <Statistic precision={0} title="Days SAP Should Have Paid" value={(this.calculateDueDays() - this.state.vacationDays) || 0} suffix="days" />
                    </Col>
                    <Divider style={{ marginBottom: "-10px", fontSize: "75px" }} type="vertical" />
                    <Col >
                        <Statistic valueStyle={{ color: this.valueColor(this.calculateOwedDays(), false) }}
                            title="Days SAP Still Owes You" value={this.calculateOwedDays() || 0} suffix="days" />
                    </Col>
                    <Col >
                        <Statistic valueStyle={{ color: this.valueColor(this.calculateOwedDays(), false) }}
                            title="Money SAP Still Owes You" value={this.calculateOwedDays() * 320 || 0} prefix="$" />
                    </Col>
                </Row>
            </Card>
        </div >
        )
    }
}