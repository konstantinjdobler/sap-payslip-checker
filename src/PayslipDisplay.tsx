import React from "react";
import { Divider, InputNumber, Card, Row, Col, Statistic } from "antd";
import { publicHolidays } from "./utils/publicHolidays";
import { PayslipData } from "./@types/public";

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
const START_INTERNSHIP_STRING = "Start of Internship";
const START_2020_STRING = "Begin of 2020";
const END_2019_STRING = "End of 2019";
const LAST_OF_2020_STRING = "Uploaded Payslip of 2020";
type PayslipDisplayState = { vacationDays: number };
type PayslipDisplayProps = { payslipData?: PayslipData; data2019: boolean; data2020: boolean };
export default class PayslipDisplay extends React.Component<PayslipDisplayProps, PayslipDisplayState> {
  state: PayslipDisplayState = {
    vacationDays: 0,
  };

  calculateDueDays() {
    if (!this.props.payslipData) return 0;
    const storedStartDate = window.localStorage.getItem("startDate");
    const startDate = storedStartDate ? new Date(storedStartDate) : new Date(2019, 8, 16); // Newport Beach start date as default
    return getBusinessDatesCount(startDate, this.props.payslipData.periodEnd, publicHolidays);
  }

  calculateOwedDays() {
    if (!this.props.payslipData) return 0;
    return (
      this.calculateDueDays() -
      this.state.vacationDays -
      (this.props.payslipData.ytdWages - this.props.payslipData.ytdNonWagePay) / 320
    );
  }

  valueColor(value: number, biggerIsBetter = true) {
    if (isNaN(value)) return;
    if (value === 0) return OK_COLOR;
    if (biggerIsBetter) return value > 0 ? GOOD_COLOR : BAD_COLOR;
    else return value < 0 ? GOOD_COLOR : BAD_COLOR;
  }
  render() {
    if (!this.props.payslipData) return <div />;
    const startString = this.props.data2019 ? START_INTERNSHIP_STRING : START_2020_STRING;
    const endString = this.props.data2020 ? LAST_OF_2020_STRING : END_2019_STRING;
    const periodDescription = ` - From ${startString} until ${endString}`;
    return (
      <div style={{ padding: "30px" }}>
        <Card title={"Earnings" + periodDescription}>
          <Row type="flex" justify="space-around">
            <Col span={4}>
              <Statistic
                precision={2}
                title="Total Gross Wages Paid To You"
                value={this.props.payslipData.ytdWages}
                prefix="$"
              />
            </Col>
            <Col span={4}>
              <Statistic
                precision={2}
                title="Other Benefits Paid To You"
                value={this.props.payslipData.ytdOtherBenefits}
                prefix="$"
              />
            </Col>
          </Row>
        </Card>
        <Card style={{ marginTop: "40px" }} title={"Taxes" + periodDescription}>
          <Row type="flex" justify="space-around">
            <Col span={4}>
              <Statistic
                precision={2}
                title="Taxes Withheld From You"
                value={this.props.payslipData.ytdPaidTaxes}
                prefix="$"
              />
            </Col>
            <Col span={4}>
              <Statistic
                precision={2}
                title="Taxes You Really Have To Pay"
                value={this.props.payslipData.ytdOwedTaxes}
                prefix="$"
              />
            </Col>
            <Divider style={{ marginBottom: "-10px", fontSize: "75px" }} type="vertical" />

            <Col>
              <Statistic
                precision={2}
                valueStyle={{
                  color: this.valueColor(this.props.payslipData.ytdPaidTaxes - this.props.payslipData.ytdOwedTaxes),
                }}
                title="Your Tax Refund"
                value={this.props.payslipData.ytdPaidTaxes - this.props.payslipData.ytdOwedTaxes || 0}
                prefix="$"
              />
            </Col>
          </Row>
        </Card>
        <Card style={{ marginTop: "40px" }} title={"Day Checker" + periodDescription}>
          <Row type="flex" justify="space-around">
            <Col span={4}>
              <span className="ant-statistic-title">Unpaid Vacation Days</span> <br />
              <InputNumber
                style={{ width: "27%", marginTop: "8px" }}
                defaultValue={0}
                onChange={value => this.setState({ vacationDays: value as number })}
                min={0}
              />
              <span
                style={{ marginLeft: "8px", color: "rgba(0, 0, 0, 0.85)" }}
                className="ant-statistic-content-suffix"
              >
                days
              </span>
            </Col>
            <Col span={4}>
              <Statistic
                precision={0}
                title="Days Paid by SAP"
                value={this.props.payslipData.ytdWages / 320 || 0}
                suffix="days"
              />
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
                valueStyle={{ color: this.valueColor(this.calculateOwedDays(), false) }}
                title="Days SAP Still Owes You"
                value={this.calculateOwedDays() || 0}
                suffix="days"
              />
            </Col>
            <Col>
              <Statistic
                valueStyle={{ color: this.valueColor(this.calculateOwedDays(), false) }}
                title="Money SAP Still Owes You"
                value={this.calculateOwedDays() * 320 || 0}
                prefix="$"
              />
            </Col>
          </Row>
        </Card>
      </div>
    );
  }
}
