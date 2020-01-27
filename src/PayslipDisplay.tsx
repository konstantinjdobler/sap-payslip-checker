import React from "react";
import { Divider, InputNumber, Card, Row, Col, Statistic, DatePicker } from "antd";
import { publicHolidays } from "./utils/publicHolidays";
import { PayslipData } from "./@types/public";
import moment from "moment";

function getBusinessDatesCount(startDate: Date, endDate: Date, holidays: Date[] = []) {
  let count = 0;
  const curDate = startDate;
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 6 && dayOfWeek !== 0 && !holidays.find(holiday => holiday.getTime() === curDate.getTime()))
      count++;
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

const GOOD_COLOR = "#3f8600";
const BAD_COLOR = "#ab4e52";
const OK_COLOR = "#f3ca04";

type PayslipDisplayState = { vacationDays: number };
type PayslipDisplayProps = { payslipData?: PayslipData; data2019?: PayslipData; data2020?: PayslipData };
export default class PayslipDisplay extends React.Component<PayslipDisplayProps, PayslipDisplayState> {
  state: PayslipDisplayState = {
    vacationDays: parseFloat(window.localStorage.getItem("vacationDays") || "0"),
  };

  getStartDate() {
    const storedStartDate = window.localStorage.getItem("startDate");
    const startDate = storedStartDate ? new Date(storedStartDate) : new Date(2019, 8, 16); // Newport Beach start date as default
    return startDate;
  }

  getEndDate() {
    if (this.props.data2020) {
      return this.props.data2020.periodEnd;
    } else {
      return this.props.data2019!.periodEnd;
    }
  }
  calculateDueDays() {
    if (!this.props.payslipData) return 0;
    return getBusinessDatesCount(this.getStartDate(), this.props.payslipData.periodEnd, publicHolidays);
  }

  calculateOwedDays() {
    if (!this.props.payslipData) return 0;
    return (
      this.calculateDueDays() -
      this.state.vacationDays -
      (this.props.payslipData.ytdWages - this.props.payslipData.ytdNonWagePay) / 320
    );
  }

  valueColor(value: number, biggerIsBetter = true, zeroIsGood = false) {
    if (isNaN(value)) return;
    if (value === 0) return zeroIsGood ? GOOD_COLOR : OK_COLOR;
    if (biggerIsBetter) return value > 0 ? GOOD_COLOR : BAD_COLOR;
    else return value < 0 ? GOOD_COLOR : BAD_COLOR;
  }

  getPeriodDescription(payslipData: PayslipData, coverWholeInternship = false) {
    const options = { year: "numeric", month: "long", day: "numeric" };
    const start =
      payslipData.periodEnd.getFullYear() === 2019 || coverWholeInternship
        ? this.getStartDate().toLocaleDateString("en-US", options)
        : new Date(2020, 0, 1).toLocaleDateString("en-US", options) + " (+ partial payslip from last year)";
    const end = payslipData.periodEnd.toLocaleDateString("en-US", options);
    return `From ${start} until ${end}`;
  }

  taxesCard(payslipData: PayslipData) {
    return (
      <Card style={{ marginTop: "40px" }} title={"Taxes - " + this.getPeriodDescription(payslipData)}>
        <Row type="flex" justify="space-around">
          <Col span={4}>
            <Statistic precision={2} title="Taxes Withheld From You" value={payslipData.ytdPaidTaxes} prefix="$" />
          </Col>
          <Col span={4}>
            <Statistic precision={2} title="Taxes You Really Have To Pay" value={payslipData.ytdOwedTaxes} prefix="$" />
          </Col>
          <Divider style={{ marginBottom: "-10px", fontSize: "75px" }} type="vertical" />
          <Col>
            <Statistic
              precision={2}
              valueStyle={{
                color: this.valueColor(payslipData.ytdPaidTaxes - payslipData.ytdOwedTaxes),
              }}
              title="Your Tax Refund"
              value={payslipData.ytdPaidTaxes - payslipData.ytdOwedTaxes}
              prefix="$"
            />
          </Col>
        </Row>
      </Card>
    );
  }

  earningsCard(payslipData: PayslipData) {
    return (
      <Card title={"Earnings - " + this.getPeriodDescription(payslipData, true)}>
        <Row type="flex" justify="space-around">
          <Col span={4}>
            <Statistic
              precision={2}
              title="Total Gross Wages Paid To You"
              value={payslipData.ytdWages - payslipData.ytdNonWagePay}
              prefix="$"
            />
          </Col>
          <Col span={4}>
            <Statistic
              precision={2}
              title="Appreciations (Gross Amount)"
              value={payslipData.ytdNonWagePay}
              prefix="$"
            />
          </Col>
          <Col span={4}>
            <Statistic
              precision={2}
              title="GTLI Benefits (Group Term Life Insurance)"
              value={payslipData.ytdOtherBenefits}
              prefix="$"
            />
          </Col>
        </Row>
      </Card>
    );
  }

  dayCheckerCard(payslipData: PayslipData) {
    return (
      <Card style={{ marginTop: "40px" }} title={"Day Checker - " + this.getPeriodDescription(payslipData, true)}>
        <Row type="flex" justify="space-around">
          <Col span={4}>
            <span className="ant-statistic-title">Unpaid Vacation Days</span> <br />
            <InputNumber
              style={{ width: "27%", marginTop: "8px" }}
              value={this.state.vacationDays}
              onChange={value => {
                if (typeof value !== "number") return;
                window.localStorage.setItem("vacationDays", value.toString());
                this.setState({ vacationDays: value });
              }}
              min={0}
            />
            <span style={{ marginLeft: "8px", color: "rgba(0, 0, 0, 0.85)" }} className="ant-statistic-content-suffix">
              days
            </span>
          </Col>
          <Col span={4}>
            <Statistic precision={0} title="Days Paid by SAP" value={payslipData.ytdWages / 320 || 0} suffix="days" />
          </Col>
          <Col span={4}>
            <Statistic
              precision={0}
              title="Days SAP Should Have Paid"
              value={this.calculateDueDays() - this.state.vacationDays || 0}
              suffix="days"
            />
          </Col>
          <Divider style={{ marginBottom: "-10px", fontSize: "75px" }} type="vertical" />
          <Col>
            <Statistic
              valueStyle={{ color: this.valueColor(this.calculateOwedDays(), false, true) }}
              title="Days SAP Still Owes You"
              value={this.calculateOwedDays() || 0}
              suffix="days"
            />
          </Col>
          <Col>
            <Statistic
              valueStyle={{ color: this.valueColor(this.calculateOwedDays(), false, true) }}
              title="Money SAP Still Owes You"
              value={this.calculateOwedDays() * 320 || 0}
              prefix="$"
            />
          </Col>
        </Row>
      </Card>
    );
  }

  render() {
    if (!this.props.payslipData) return <div />;
    return (
      <div style={{ padding: "30px" }}>
        {this.earningsCard(this.props.payslipData)}
        {this.props.data2019 && this.taxesCard(this.props.data2019)}
        {this.props.data2020 && this.taxesCard(this.props.data2020)}
        {this.dayCheckerCard(this.props.payslipData)}
        <Card style={{ maxWidth: "fit-content", margin: "40px auto 0px" }} title="Internship Start Date">
          <DatePicker
            format={"MMMM D, YYYY"}
            defaultValue={moment(this.getStartDate())}
            allowClear={false}
            showToday={false}
            onChange={date => {
              // allowClear = false protects against date === null
              const storeableValue = date!.format("YYYY/MM/DD");
              window.localStorage.setItem("startDate", storeableValue);
              this.forceUpdate();
            }}
          ></DatePicker>
        </Card>
      </div>
    );
  }
}
