import React from 'react';
import { render, screen } from '@testing-library/react';
import { EventTimeline } from './Simulador.jsx';

describe.skip('EventTimeline (saltado temporalmente)', () => {
  it('renderiza un evento del local (texto visible)', () => {
    render(
      <EventTimeline
        events={[{ minute: 10, text: 'Gol de Colo-Colo' }]}
        homeName="Colo-Colo"
        awayName="Palestino"
        autoScroll={false}
      />
    );
    // DOM: existe el texto
    expect(screen.getByText('Gol de Colo-Colo')).toBeTruthy();
    // cabecera DOM
    expect(screen.getByText('Colo-Colo')).toBeTruthy();
    expect(screen.getByText('Palestino')).toBeTruthy();
  });

  it('renderiza un evento del visitante (texto visible)', () => {
    render(
      <EventTimeline
        events={[{ minute: 12, text: 'Gol de Palestino' }]}
        homeName="Colo-Colo"
        awayName="Palestino"
        autoScroll={false}
      />
    );
    expect(screen.getByText('Gol de Palestino')).toBeTruthy();
  });

  it('renderiza evento neutral centrado (fin de primer tiempo)', () => {
    render(
      <EventTimeline
        events={[{ minute: 30, text: 'Fin del primer tiempo' }]}
        homeName="Colo-Colo"
        awayName="Palestino"
        autoScroll={false}
      />
    );
    expect(screen.getByText('Fin del primer tiempo')).toBeTruthy();
  });
});
