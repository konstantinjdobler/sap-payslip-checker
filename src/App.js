import React from 'react';
import PayslipUpload from './PayslipUpload';
import PayslipDisplay from './PayslipDisplay';
export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      data: null
    }
  }
  transmitParsedPayslipData = (data) => {
    this.setState({ data })
  }
  render() {
    return (<>
      <PayslipUpload transmitData={this.transmitParsedPayslipData} />
      <PayslipDisplay {...this.state.data} />
    </>
    );
  }

}

