import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { debounce } from "lodash";
import { sidebarField } from "../../globalStyles";
import { controlsWidth, nucleotide_gene } from "../../util/globals";
import { changeColorBy } from "../../actions/colors";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { isColorByGenotype, decodeColorByGenotype, encodeColorByGenotype, decodePositions } from "../../util/getGenotype";
import CustomSelect from "./customSelect";

@connect((state) => {
    return {
      geneLength: state.controls.geneLength,
      treatments: state.controls.treatments,
      colorings: state.metadata.colorings,
      geneMap: state.entropy.geneMap
    };
})

class Treatments extends React.Component {
    constructor(props) {
      super(props);
  
      this.BLANK_STATE = {
        // These are values for controlled form components, so cannot be null.
        geneSelected: "",
        treatmentSelected: "",
        positionSelected: ""
      };

      const gS = Object.keys(this.props.geneMap)[0]
      const tS = Object.keys(this.props.treatments[gS])[0]

      alert("Treatments")
      alert(gS)
      alert(tS)
      alert(this.props.treatments[gS][tS])

      this.state = this.newState({
        geneSelected: Object.keys(this.props.geneMap)[0],
        treatmentSelect: Object.keys(this.props.treatments[gS])[0],
        positionSelected: this.props.treatments[gS][tS]
      });
    }

    static propTypes = {
      colorBy: PropTypes.string.isRequired,
      geneLength: PropTypes.object.isRequired,
      treatments: PropTypes.object.isRequired,
      colorings: PropTypes.object.isRequired,
      dispatch: PropTypes.func.isRequired
    }
  
    // Applies the given state to the immutable blank state and replaces the
    // current state with the result.
    replaceState(state) {
      this.setState((oldState, props) => this.newState(state)); // eslint-disable-line no-unused-vars
    }
  
    newState(state) {
      return {
        ...this.BLANK_STATE,
        ...state
      };
    }

  
    // State from the outside world enters via props.
    /*
    componentWillReceiveProps(nextProps) {
      if (this.props.colorBy !== nextProps.colorBy) {
        if (isColorByGenotype(nextProps.colorBy)) {
          const genotype = decodeColorByGenotype(nextProps.colorBy);
  
          if (genotype) {
            this.replaceState({
              colorBySelected: "gt",
              geneSelected: genotype.gene,
              positionSelected: genotype.positions.join(",")
            });
          }
        } else {
          this.replaceState({
            colorBySelected: nextProps.colorBy
          });
        }
      }
    }
    */
  
    // Our internal state is published back to the outside world when it changes.
    componentDidUpdate() {
      const colorBySelected = this.state.colorBySelected;
  
      if (colorBySelected === "gt") {
        const { geneSelected, positionSelected } = this.state;
  
        // Only dispatch a change to the app's colorBy if we have a
        // fully-specified genotype (gene and position).
        if (geneSelected && positionSelected) {
          const genotype = encodeColorByGenotype({
            gene: geneSelected,
            positions: decodePositions(positionSelected, this.props.geneLength[geneSelected])
          });
  
          if (genotype) {
            this.dispatchColorByGenotype(genotype);
          }
        }
      } else {
        this.dispatchColorBy(colorBySelected);
      }
    }
  
    /**
     * Avoids double invocation of change() method
     */
    
    shouldComponentUpdate(nextProps, nextState) {
      if (this.state.colorBySelected === nextState.colorBySelected &&
          this.state.geneSelected === nextState.geneSelected &&
          this.state.positionSelected === nextState.positionSelected &&
          this.props.colorings === nextProps.colorings) {
        return false;
      }
      return true;
    }
  
    dispatchColorBy(colorBy, name = colorBy) {
      analyticsControlsEvent(`color-by-${name}`);
      this.props.dispatch(changeColorBy(colorBy));
    }
  
    dispatchColorByGenotype = debounce((genotype) => {
      this.dispatchColorBy(genotype, "genotype");
    }, 400);
  
    getTreatmentOptions() {
      alert(this.props.treatments[this.state.geneSelected])
      const options = [];
      if (this.props.treatments[this.state.geneSelected]) {
        alert("HEHE")
        alert(this.state.geneSelected)
        alert(this.props.treatments[this.state.geneSelected])
        Object.keys(this.props.treatments[this.state.geneSelected]).forEach((treat) => options.push({value: treat, label: treat}));
      }
      return options;
    }

    treatmentSelect() {
      const styles = this.getStyles();
  
      const currTreatmentOptions = this.getTreatmentOptions();
    
      return (
        <div style={styles.base} id="viewTreaments">
          <CustomSelect
            name="viewTreatmentLocationsInsideGenes"
            id="viewTreatmentLocationsInsideGenes"
            placeholder="treatment"
            value={currTreatmentOptions.filter(({value}) => value === this.state.treatmentSelect)}
            options={currTreatmentOptions}
            isClearable={false}
            isSearchable
            isMulti={false}
            onChange={(opt) => {
              this.setState({ treatmentSelected: opt.value });
            }}
          />
        </div>
      );
    }
  
    isNormalInteger(str) {
      const n = Math.floor(Number(str));
      return String(n) === str && n >= 0;
    }
  
    getStyles() {
      return {
        base: {
          width: controlsWidth,
          marginBottom: 0,
          fontSize: 14
        }
      };
    }
  
    getGtGeneOptions() {
      const options = [];
      if (this.props.geneMap) {
        Object.keys(this.props.geneMap).forEach((prot) => options.push({value: prot, label: prot}));
      }
      return options;
    }

    render() {
      const styles = this.getStyles();
  
      const gtGeneOptions = this.getGtGeneOptions();
  
      return (
        <div style={styles.base} id="viewGenesForTreatment">
          <CustomSelect
            name="viewGeneAvailableForTreatment"
            id="viewGeneAvailableForTreatment"
            placeholder="gene…"
            value={gtGeneOptions.filter(({value}) => value === this.state.geneSelected)}
            options={gtGeneOptions}
            isClearable={false}
            isSearchable
            isMulti={false}
            onChange={(opt) => {
              this.setState({ treatmentSelected: opt.value });
            }}
          />
          <div>
            {this.treatmentSelect()}
          </div>
        </div>
        );
    }
  }

export const TreatmentInfo = (
  <>
    View treatment options that target specific genes.
    <br/>
    The positions that the treatment targets on the gene will be displayed on the phylogeny in a consistent manner.
  </>
);
  
export default Treatments;