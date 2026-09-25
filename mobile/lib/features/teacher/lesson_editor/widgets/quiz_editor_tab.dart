import 'package:flutter/material.dart';

/// ============================================================
/// QuizEditorTab — Aba de cadastro de Perguntas do Quiz
/// ============================================================
/// Formulário dinâmico para o professor:
/// - Configurar temporizador (opcional)
/// - Adicionar/remover perguntas com alternativas
/// - Definir resposta correta para cada pergunta
class QuizEditorTab extends StatefulWidget {
  final bool isTimerEnabled;
  final ValueChanged<bool> onTimerToggle;
  final TextEditingController timeLimitController;
  final List<QuizQuestionData> questions;
  final VoidCallback onAddQuestion;
  final ValueChanged<int> onRemoveQuestion;

  const QuizEditorTab({
    super.key,
    required this.isTimerEnabled,
    required this.onTimerToggle,
    required this.timeLimitController,
    required this.questions,
    required this.onAddQuestion,
    required this.onRemoveQuestion,
  });

  @override
  State<QuizEditorTab> createState() => _QuizEditorTabState();
}

class _QuizEditorTabState extends State<QuizEditorTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // ── Configurações do Quiz ──
        _buildQuizSettings(theme),

        const SizedBox(height: 28),

        // ── Lista de Perguntas ──
        Row(
          children: [
            const Icon(Icons.quiz_rounded, size: 18, color: Color(0xFF8B5CF6)),
            const SizedBox(width: 8),
            Text(
              'Perguntas (${widget.questions.length})',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: Color(0xFFF1F5F9),
              ),
            ),
            const Spacer(),
            // Botão Adicionar Pergunta
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF8B5CF6), Color(0xFF3B82F6)],
                ),
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF8B5CF6).withOpacity(0.3),
                    blurRadius: 12,
                    spreadRadius: 0,
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: widget.onAddQuestion,
                  child: const Padding(
                    padding:
                        EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.add_rounded, size: 18, color: Colors.white),
                        SizedBox(width: 6),
                        Text(
                          'Pergunta',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),

        // ── Perguntas ──
        if (widget.questions.isEmpty)
          _buildEmptyState(theme)
        else
          ...List.generate(widget.questions.length, (index) {
            return _buildQuestionCard(index, widget.questions[index], theme);
          }),

        const SizedBox(height: 40),
      ],
    );
  }

  // ── Configurações do Quiz ──
  Widget _buildQuizSettings(ThemeData theme) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A3E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF2D2D5E)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.settings_rounded,
                  size: 18, color: Color(0xFF8B5CF6)),
              SizedBox(width: 8),
              Text(
                'Configurações do Quiz',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: Color(0xFFF1F5F9),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Toggle Temporizador
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Temporizador',
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Define um limite de tempo para o quiz',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Switch(
                value: widget.isTimerEnabled,
                onChanged: widget.onTimerToggle,
                activeColor: const Color(0xFF8B5CF6),
                activeTrackColor: const Color(0xFF8B5CF6).withOpacity(0.3),
              ),
            ],
          ),

          // Campo de tempo (visível apenas se timer ativo)
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.only(top: 12),
              child: TextFormField(
                controller: widget.timeLimitController,
                keyboardType: TextInputType.number,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurface,
                ),
                decoration: const InputDecoration(
                  hintText: 'Tempo em segundos (ex: 600 = 10 min)',
                  prefixIcon: Icon(Icons.timer_rounded),
                ),
              ),
            ),
            crossFadeState: widget.isTimerEnabled
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 300),
          ),
        ],
      ),
    );
  }

  // ── Estado Vazio ──
  Widget _buildEmptyState(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 60),
      decoration: BoxDecoration(
        color: const Color(0xFF111128),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF2D2D5E),
          style: BorderStyle.solid,
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.quiz_outlined,
            size: 48,
            color: const Color(0xFF8B5CF6).withOpacity(0.5),
          ),
          const SizedBox(height: 12),
          Text(
            'Nenhuma pergunta adicionada',
            style: theme.textTheme.titleMedium?.copyWith(
              color: const Color(0xFF94A3B8),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Clique em "+ Pergunta" para começar',
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  // ── Card de Pergunta ──
  Widget _buildQuestionCard(
      int index, QuizQuestionData question, ThemeData theme) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A3E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF2D2D5E)),
      ),
      child: Column(
        children: [
          // Header do card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Color(0xFF2D2D5E)),
              ),
            ),
            child: Row(
              children: [
                // Número da pergunta
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF8B5CF6), Color(0xFF3B82F6)],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  'Pergunta ${index + 1}',
                  style: const TextStyle(
                    color: Color(0xFFF1F5F9),
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const Spacer(),
                // Botão remover
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded,
                      color: Color(0xFFEF4444), size: 20),
                  onPressed: () => widget.onRemoveQuestion(index),
                  tooltip: 'Remover pergunta',
                  splashRadius: 20,
                ),
              ],
            ),
          ),

          // Corpo do card
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Enunciado
                TextFormField(
                  controller: question.textController,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: theme.colorScheme.onSurface,
                  ),
                  maxLines: 3,
                  decoration: const InputDecoration(
                    hintText: 'Digite o enunciado da pergunta...',
                    prefixIcon: Padding(
                      padding: EdgeInsets.only(bottom: 40),
                      child: Icon(Icons.help_outline_rounded),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Alternativas
                ...List.generate(question.optionControllers.length, (optIdx) {
                  final isCorrect = question.correctIndex == optIdx;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      children: [
                        // Radio de resposta correta
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              question.correctIndex = optIdx;
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isCorrect
                                  ? const Color(0xFF10B981)
                                  : Colors.transparent,
                              border: Border.all(
                                color: isCorrect
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFF64748B),
                                width: 2,
                              ),
                            ),
                            child: isCorrect
                                ? const Icon(Icons.check_rounded,
                                    size: 14, color: Colors.white)
                                : null,
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Label (A, B, C, D)
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: isCorrect
                                ? const Color(0xFF10B981).withOpacity(0.15)
                                : const Color(0xFF1E1E48),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: isCorrect
                                  ? const Color(0xFF10B981).withOpacity(0.5)
                                  : const Color(0xFF2D2D5E),
                            ),
                          ),
                          child: Center(
                            child: Text(
                              String.fromCharCode(65 + optIdx),
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                                color: isCorrect
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFF94A3B8),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Campo da alternativa
                        Expanded(
                          child: TextFormField(
                            controller: question.optionControllers[optIdx],
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurface,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Alternativa ${String.fromCharCode(65 + optIdx)}',
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 10),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide(
                                  color: isCorrect
                                      ? const Color(0xFF10B981).withOpacity(0.5)
                                      : const Color(0xFF2D2D5E),
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(
                                    color: Color(0xFF8B5CF6), width: 2),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),

                const SizedBox(height: 8),

                // Dica de resposta correta
                Row(
                  children: [
                    Icon(Icons.info_outline_rounded,
                        size: 14,
                        color: const Color(0xFF10B981).withOpacity(0.7)),
                    const SizedBox(width: 6),
                    Text(
                      'Toque no círculo para marcar a resposta correta',
                      style: TextStyle(
                        fontSize: 11,
                        color: const Color(0xFF10B981).withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// ============================================================
/// Modelo de dados local para uma pergunta do quiz
/// ============================================================
class QuizQuestionData {
  final TextEditingController textController;
  final List<TextEditingController> optionControllers;
  int correctIndex;

  QuizQuestionData({
    String? text,
    List<String>? options,
    this.correctIndex = 0,
  })  : textController = TextEditingController(text: text ?? ''),
        optionControllers = (options ?? ['', '', '', ''])
            .map((o) => TextEditingController(text: o))
            .toList();

  void dispose() {
    textController.dispose();
    for (final c in optionControllers) {
      c.dispose();
    }
  }
}
