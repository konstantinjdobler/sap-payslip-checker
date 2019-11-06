import React from "react"
import { Icon, Card, Row, Col, Statistic } from 'antd';


export default class PayslipDisplay extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            ytdWages: props.ytdWages,
            ytdOtherBenefits: props.ytdOtherBenefits,
            ytdPaidTaxes: props.ytdPaidTaxes,
            ytdOwedTaxes: props.ytdOwedTaxes,

        }
    }
    render() {
        return (<div style={{ padding: '30px' }}>
            <Card title="Earnings" >
                <Row type="flex" justify="space-around">
                    <Col span={4}>
                        <Statistic precision={2} title="Wages YTD" value={this.props.ytdWages} prefix="$" />
                    </Col>
                    <Col span={4}>
                        <Statistic precision={2} title="Other Benefits YTD" value={this.props.ytdOtherBenefits} prefix="$" />
                    </Col>
                </Row>
            </Card>
            <Card style={{ marginTop: "40px" }} title="Taxes" >
                <Row type="flex" justify="space-around">
                    <Col span={4}>
                        <Statistic precision={2} title="Taxes Withheld YTD" value={this.props.ytdPaidTaxes} prefix="$" />
                    </Col>
                    <Col span={4}>
                        <Statistic precision={2} title="Taxes Owed YTD" value={this.props.ytdOwedTaxes} prefix="$" />
                    </Col>
                    <Col>
                        <Statistic precision={2} valueStyle={{ color: '#3f8600' }}
                            title="Tax Refund" value={(this.props.ytdPaidTaxes - this.props.ytdOwedTaxes) || 0} prefix="$" />
                    </Col>
                </Row>
            </Card>
        </div >
        )
    }
}