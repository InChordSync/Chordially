import { render } from '@testing-library/react-native'

import App from '../../App'

describe('App', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<App />)

    expect(getByText('Chordially mobile foundation')).toBeTruthy()
  })
})
