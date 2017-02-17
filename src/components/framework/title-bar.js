import React from "react";
import Flex from "./flex";
import { titleColors, titleBarHeight } from "../../util/globals";
import { titleFont, darkGrey, medGrey, lightGrey, brandColor } from "../../globalStyles";
import Radium from "radium";
import Title from "./title";
import { Link } from "react-router-dom";

/*
This titlebar is not great, mostly becuase I'm no expert at flexbox.
You have free reign to make this titlebar great again.
*/
@Radium
class TitleBar extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    dataName: React.PropTypes.string
  }
  getStyles() {
    return {
      title: {
        fontFamily: titleFont,
        fontSize: 48,
        lineHeight: "28px",
        marginTop: 0,
        marginBottom: 2,
        fontWeight: 500,
        color: medGrey,
        padding: "8px"
      },
      main: {
        height: titleBarHeight,
        justifyContent: "space-between",
        backgroundColor: "#eaebeb",
        marginBottom: 5,
        boxShadow: "0px -1px 1px 1px rgba(215,215,215,0.85) inset" // from card
      },
      link: {
        alignSelf: "center",
        padding: "8px",
        color: brandColor,
        textDecoration: "none",
        cursor: "pointer",
        fontSize: 16
      },
      alerts: {
        textAlign: "center",
        verticalAlign: "middle",
        width: 70,
        color: brandColor
      },
      dataName: {
        textAlign: "center",
        verticalAlign: "text-bottom",
        color: darkGrey,
        fontSize: 18
      }
    };
  }
  render() {
    const styles = this.getStyles();
    const dataName = this.props.dataName ?
      <div style={styles.dataName}>{this.props.dataName}</div> : null;
    return (
      <div>
        <Flex style={styles.main}>
          <div style={{flex: 1 }}/>
          <Link style={styles.link} to="/">
            <Title style={styles.title}/>
          </Link>
          {dataName}
          <div style={{flex: 40 }}/>
          <Link style={styles.link} to="/about">About</Link>
          <Link style={styles.link} to="/methods">Methods</Link>
          <Link style={styles.link} to="/help">Help</Link>
          <div style={{flex: 1 }}/>
        </Flex>
      </div>
    );
  }
}

export default TitleBar;
